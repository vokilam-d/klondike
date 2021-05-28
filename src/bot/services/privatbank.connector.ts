import { HttpService, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { IPrivatbankBalanceData } from '../interfaces/privatbank-statements-data.interface';
import { XmlBuilder } from '../../shared/services/xml-builder/xml-builder.service';
import { EncryptorService } from '../../shared/services/encryptor/encryptor.service';
import { addLeadingZeros } from '../../shared/helpers/add-leading-zeros.function';
import { CronProdPrimaryInstance } from '../../shared/decorators/primary-instance-cron.decorator';
import { Subject } from 'rxjs';
import { IPayment } from '../interfaces/payment.interface';
import { IPrivatbankResponse } from '../interfaces/privatbank-response.interface';
import { IPrivatbankStatementsData } from '../interfaces/privatbank-balance-data.interface';
import { isProdEnv } from '../../shared/helpers/is-prod-env.function';

const CRON_EVERY_2_MINUTES = '*/2 * * * *';

@Injectable()
export class PrivatbankConnector implements OnApplicationBootstrap {

  private logger = new Logger(PrivatbankConnector.name);
  private lastPaymentId: string = null;
  private apiHost = 'https://api.privatbank.ua/p24api';

  newPayment$ = new Subject<IPayment>();

  constructor(
    private readonly http: HttpService,
    private readonly xmlBuilder: XmlBuilder,
    private readonly encryptor: EncryptorService
  ) { }

  onApplicationBootstrap(): any {
    if (!isProdEnv()) {
      return;
    }

    this.setLastPaymentId();
  }

  @CronProdPrimaryInstance(CRON_EVERY_2_MINUTES)
  async handleNewPayments(): Promise<void> {
    let statementsData: IPrivatbankStatementsData;
    try {
      statementsData = await this.getPaymentsForToday();
    } catch (e) {
      this.logger.error(`Could not handle new payments:`);
      this.logger.error(e);
      return;
    }

    const statements = statementsData.info?.statements?.statement || [];

    if (!statements.findIndex) {
      console.log({statements});
    }

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

      this.newPayment$.next({
        amount: this.getReadableAmount(statement['@cardamount']),
        description: statement['@description'],
        balance: this.getReadableAmount(statement['@rest']),
        source: 'ПриватБанк'
      });
    }
  }

  private async setLastPaymentId(): Promise<void> {
    let statementsData: IPrivatbankStatementsData;
    try {
      statementsData = await this.getPaymentsForToday();
    } catch (e) {
      this.logger.error(`Could not set last payment id:`);
      this.logger.error(e);
      return;
    }

    const statement = statementsData.info?.statements?.statement[0];
    if (!statement) {
      return;
    }

    this.lastPaymentId = statement['@appcode'];
  }

  private async getPaymentsForToday(): Promise<IPrivatbankStatementsData> {
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

    return this.sendRequest<IPrivatbankStatementsData>(`/rest_fiz`, requestContentObj);
  }

  async getBalance(): Promise<string> {
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
            '@name': 'country',
            '@value': 'UA'
          }
        ]
      }
    };

    const balanceData = await this.sendRequest<IPrivatbankBalanceData>(`/balance`, requestContentObj);
    return balanceData.info.cardbalance.balance;
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

  private async sendRequest<T>(apiSlug: string, requestContentObj: { [key: string]: any }): Promise<T> {
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

    const apiUrl = `${this.apiHost}${apiSlug}`;
    const headers = { 'Content-Type': 'text/xml' };
    const axiosResponse = await this.http.post<string>(apiUrl, requestXml, { headers }).toPromise();

    const response = this.xmlBuilder.convertToObject(axiosResponse.data) as IPrivatbankResponse<T>;
    if (response.response.data.error) {
      throw new Error(response.response.data.error['@message']);
    } else {
      return response.response.data as T;
    }
  }
}
