import { HttpService, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { IMonobankUpdate } from '../interfaces/monobank-update.interface';
import { addLeadingZeros } from '../../shared/helpers/add-leading-zeros.function';
import { EventsService } from '../../shared/services/events/events.service';
import { Subject } from 'rxjs';
import { IPayment } from '../interfaces/payment.interface';
import { IMonobankStatement } from '../interfaces/monobank-statement.interface';
import { isProdEnv } from '../../shared/helpers/is-prod-env.function';

@Injectable()
export class MonobankConnector implements OnApplicationBootstrap {

  private paymentEventName = 'new-payment';
  private sentPaymentIds: Set<string> = new Set();
  private account: string = process.env.MONOBANK_ACCOUNT;
  private apiHost = 'https://api.monobank.ua';

  newPayment$ = new Subject<IPayment>();

  constructor(
    private readonly eventsService: EventsService,
    private readonly http: HttpService
  ) { }

  onApplicationBootstrap(): any {
    if (!isProdEnv()) {
      return;
    }

    this.handlePaymentUpdates();
  }

  onUpdate(update: IMonobankUpdate): void {
    if (update.type !== 'StatementItem') {
      return;
    }
    if (update.data.account !== this.account) {
      return;
    }

    const amount = update.data.statementItem.amount;
    if (amount < 0) {
      return;
    }

    const paymentId = update.data.statementItem.id;
    if (this.sentPaymentIds.has(paymentId)) {
      return;
    }
    this.onNewPayment(paymentId);

    this.newPayment$.next({
      amount: this.getReadableAmount(amount),
      description: update.data.statementItem.description,
      comment: update.data.statementItem.comment,
      balance: this.getReadableAmount(update.data.statementItem.balance),
      source: 'monobank'
    });
  }

  async getBalance(): Promise<string> {
    const account = process.env.MONOBANK_ACCOUNT;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const token = process.env.MONOBANK_API_TOKEN;

    const url = `${this.apiHost}/personal/statement/${account}/${weekAgo.getTime()}`;
    const response = await this.http.get<IMonobankStatement[]>(url, { headers: { 'X-Token': token } }).toPromise();

    const balance = response.data[0]?.balance;

    return this.getReadableAmount(balance);
  }

  private getReadableAmount(amount: number): string {
    const amountStr = `${amount}`;
    let afterPoint = addLeadingZeros(amountStr.slice(-2), 2);
    return `${amountStr.slice(0, amountStr.length - 2)}.${afterPoint}`;
  }

  private onNewPayment(paymentId: string) {
    this.eventsService.emit(this.paymentEventName, paymentId);
  }

  private handlePaymentUpdates() {
    this.eventsService.on(this.paymentEventName, (paymentId: string) => {
      this.sentPaymentIds.add(paymentId);
    });
  }
}
