import { IPrivatbankStatement } from './privatbank-statement.interface';

export interface IPrivatbankStatementsResponse {
  response: {
    '@version': string;
    merchant: {
      id: string;
      signature: string;
    };
    data: {
      error?: {
        '@message': string;
      };
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
  };
}
