import { IPrivatbankStatement } from './privatbank-statement.interface';

export interface IPrivatbankResponse<T> {
  response: {
    '@version': string;
    merchant: {
      id: string;
      signature: string;
    };
    data: {
      error?: {
        '@message': string;
      } & T;
    }
  };
}
