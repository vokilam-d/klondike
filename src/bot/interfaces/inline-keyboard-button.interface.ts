export interface ITelegramInlineKeyboardButton {
  text: string;
  url?: string;
  login_url?: any;
  callback_data?: string;
  switch_inline_query?: string;
  callback_game?: any;
  pay?: boolean;
}
