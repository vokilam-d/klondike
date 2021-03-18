import { ITelegramSticker } from './sticker.interface';

export interface ITelegramStickerSet {
  name: string;
  title: string;
  is_animated: boolean;
  contains_masks: boolean;
  stickers: ITelegramSticker[];
  thumb?: any;
}
