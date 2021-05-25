import { IMonobankStatement } from './monobank-statement.interface';

export interface IMonobankUpdate {
  type: 'StatementItem' | string;
  data: {
    account: string;
    statementItem: IMonobankStatement;
  }
}
