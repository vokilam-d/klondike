import { ITelegramUser } from './user.interface';
import { ITelegramChat } from './chat.interface';
import { ITelegramSticker } from './sticker.interface';
import { ITelegramContact } from './contact.interface';
import { ITelegramInlineKeyboardMarkup } from './inline-keyboard-markup.interface';

export interface ITelegramMessage {
  message_id: number;
  from?: ITelegramUser;
  sender_chat?: ITelegramChat;
  date: number;
  chat: ITelegramChat;
  forward_from?: ITelegramUser;
  forward_from_chat?: ITelegramChat;
  forward_from_message_id?: number;
  forward_signature?: string;
  forward_sender_name?: string;
  forward_date?: number;
  reply_to_message?: ITelegramMessage;
  via_bot?: ITelegramUser;
  edit_date?: number;
  media_group_id?: string;
  author_signature?: string;
  text?: string;
  entities?: any[];
  animation?: any;
  audio?: any;
  document?: any;
  photo?: any[];
  sticker?: ITelegramSticker;
  video?: any;
  video_note?: any;
  voice?: any;
  caption?: string;
  caption_entities?: any;
  contact?: ITelegramContact;
  dice?: any;
  game?: any;
  poll?: any;
  venue?: any;
  location?: any;
  new_chat_members?: ITelegramUser[];
  left_chat_member?: ITelegramUser;
  new_chat_title?: string;
  new_chat_photo?: any;
  delete_chat_photo?: true;
  group_chat_created?: true;
  supergroup_chat_created?: true;
  channel_chat_created?: true;
  message_auto_delete_timer_changed?: ITelegramMessage;
  migrate_to_chat_id?: number;
  migrate_from_chat_id?: number;
  pinned_message?: ITelegramMessage;
  invoice?: any;
  connected_website?: string;
  passport_data?: any;
  proximity_alert_triggered?: any;
  voice_chat_started?: any;
  voice_chat_ended?: any;
  voice_chat_participants_invited?: any;
  reply_markup?: ITelegramInlineKeyboardMarkup;
}
