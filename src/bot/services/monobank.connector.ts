import { Injectable } from '@nestjs/common';
import { BotService } from './bot.service';
import { IMonobankUpdate } from '../interfaces/monobank-update.interface';

@Injectable()
export class MonobankConnector {

  private account: string = process.env.MONOBANK_ACCOUNT;

  constructor(
    private readonly botService: BotService
  ) { }

  onUpdate(update: IMonobankUpdate): void {
    if (update.type !== 'StatementItem') {
      return;
    }
    if (update.data.account !== this.account) {
      return;
    }

    const amount = update.data.statementItem.amount
  }
}
