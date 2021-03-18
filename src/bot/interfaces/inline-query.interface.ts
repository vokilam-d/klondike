import { ITelegramUser } from './user.interface';

export interface ITelegramInlineQuery {
  id: string;
  from:	ITelegramUser;
  location: any;
  query: string;
  offset: string;
}
