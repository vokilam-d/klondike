import { ITelegramReplyKeyboardButton } from './reply-keyboard-button.interface';

export interface ITelegramReplyKeyboardMarkup {
  keyboard: ITelegramReplyKeyboardButton[][];
  resize_keyboard: boolean;
  one_time_keyboard: boolean;
  selective: boolean;
}
