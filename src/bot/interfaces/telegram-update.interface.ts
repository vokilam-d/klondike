import { ITelegramMessage } from './message.interface';
import { ITelegramInlineQuery } from './inline-query.interface';

export interface ITelegramUpdate {
  update_id: number;
  message?: ITelegramMessage;
  edited_message?: ITelegramMessage;
  channel_post?: ITelegramMessage;
  edited_channel_post?: ITelegramMessage;
  inline_query?: ITelegramInlineQuery;
  chosen_inline_result?: any;
  callback_query?: any;
  shipping_query?: any;
  pre_checkout_query?: any;
  poll?: any;
  poll_answer?: any;
  my_chat_member?: any;
  chat_member?: any;
}
