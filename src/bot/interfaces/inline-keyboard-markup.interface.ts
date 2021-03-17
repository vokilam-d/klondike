import { ITelegramInlineKeyboardButton } from './inline-keyboard-button.interface';

export interface ITelegramInlineKeyboardMarkup {
  inline_keyboard: ITelegramInlineKeyboardButton[][];
}
