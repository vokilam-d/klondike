import { HttpService, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { BotService } from './bot.service';
import { IPrivatbankStatementsResponse } from '../interfaces/privatbank-statements-response.interface';
import { XmlBuilder } from '../../shared/services/xml-builder/xml-builder.service';
import { EncryptorService } from '../../shared/services/encryptor/encryptor.service';
import { addLeadingZeros } from '../../shared/helpers/add-leading-zeros.function';
import { CronProdPrimaryInstance } from '../../shared/decorators/primary-instance-cron.decorator';

const CRON_EVERY_2_MINUTES = '*/2 * * * *';

@Injectable()
export class PrivatbankConnector implements OnApplicationBootstrap {

  private logger = new Logger(PrivatbankConnector.name);
  private lastPaymentId: string = null;
  private apiHost = 'https://api.privatbank.ua/p24api';

  constructor(
    private readonly botService: BotService,
    private readonly http: HttpService,
    private readonly xmlBuilder: XmlBuilder,
    private readonly encryptor: EncryptorService
  ) { }

  onApplicationBootstrap(): any {
    this.setLastPaymentId();
  }

  @CronProdPrimaryInstance(CRON_EVERY_2_MINUTES)
  async handleNewPayments(): Promise<void> {
    let paymentResponse: IPrivatbankStatementsResponse;
    try {
      paymentResponse = await this.getPaymentsForToday();
    } catch (e) {
      this.logger.error(`Could not handle new payments:`);
      this.logger.error(e);
      return;
    }

    const statements = paymentResponse.response.data.info.statements.statement;

    const indexOfLastPaymentId = statements.findIndex(statement => statement['@appcode'] === this.lastPaymentId);
    for (let i = statements.length - 1; i >= 0; i--) {
      const statement = statements[i];

      if (i === 0) {
        this.lastPaymentId = statement['@appcode'];
      }

      if (indexOfLastPaymentId > -1 && i >= indexOfLastPaymentId) {
        continue;
      }

      const amount = parseInt(statement['@cardamount']);
      if (amount < 0) {
        continue;
      }

      this.botService.onNewPayment({
        amount: this.getReadableAmount(statement['@cardamount']),
        description: statement['@description'],
        balance: this.getReadableAmount(statement['@rest']),
        source: 'ПриватБанк'
      });
    }
  }

  private async setLastPaymentId(): Promise<void> {
    let paymentResponse: IPrivatbankStatementsResponse;
    try {
      paymentResponse = await this.getPaymentsForToday();
    } catch (e) {
      this.logger.error(`Could not set last payment id:`);
      this.logger.error(e);
      return;
    }

    const statement = paymentResponse.response.data.info.statements.statement[0];
    if (!statement) {
      return;
    }

    this.lastPaymentId = statement['@appcode'];
  }

  private async getPaymentsForToday(): Promise<IPrivatbankStatementsResponse> {
    const today = new Date();
    const yesterDay = new Date();
    yesterDay.setDate(yesterDay.getDate() - 1);

    const requestContentObj = {
      oper: 'cmt',
      wait: '0',
      test: '0',
      payment: {
        '@id': '',
        prop: [
          {
            '@name': 'cardnum',
            '@value': process.env.PRIVATBANK_CARD_NUMBER
          },
          {
            '@name': 'sd',
            '@value': this.buildDateStr(yesterDay)
          },
          {
            '@name': 'ed',
            '@value': this.buildDateStr(today)
          }
        ]
      }
    };

    const requestContentXml = this.xmlBuilder.buildElement(requestContentObj);
    const signature = await this.buildSignature(requestContentXml);

    const requestObj = {
      request: {
        '@version': '1.0',
        merchant: {
          id: process.env.PRIVATBANK_MERCHANT,
          signature
        },
        data: requestContentObj
      }
    };
    const requestXml = this.xmlBuilder.buildDocument(requestObj, { prettyPrint: false });

    const apiUrl = `${this.apiHost}/rest_fiz`;
    const headers = { 'Content-Type': 'text/xml' };
    const axiosResponse = await this.http.post<string>(apiUrl, requestXml, { headers }).toPromise();

    const response = this.xmlBuilder.convertToObject(axiosResponse.data) as IPrivatbankStatementsResponse;
    if (response.response.data.error) {
      throw new Error(response.response.data.error['@message']);
    } else {
      return response;
    }
  }

  private async buildSignature(xmlData: string): Promise<string> {
    let signature = `${xmlData}${process.env.PRIVATBANK_API_PASSWORD}`;
    signature = await this.encryptor.hash(signature, 'md5');
    signature = await this.encryptor.hash(signature, 'sha1');

    return signature;
  }

  private buildDateStr(date: Date): string {
    const day = addLeadingZeros(date.getDate(), 2);
    const month = addLeadingZeros(date.getMonth() + 1, 2);
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  }

  private getReadableAmount(amount: string): string {
    return amount.split(' ')[0];
  }
}
