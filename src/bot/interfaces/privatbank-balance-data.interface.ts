import { IPrivatbankStatement } from './privatbank-statement.interface';

export interface IPrivatbankStatementsData {
  oper: string;
  info: {
    statements: {
      '@status': string;
      '@credit': string;
      '@debet': string;
      statement: IPrivatbankStatement[];
    }
  }
}
