import { ITelegramMessage } from './message.interface';

export interface ITelegramChat {
  id: number;
  type: string;
  title: string;
  username: string;
  first_name: string;
  last_name: string;
  photo: any;
  bio: string;
  description: string;
  invite_link: string;
  pinned_message:	ITelegramMessage;
  permissions: any;
  slow_mode_delay: number;
  message_auto_delete_time: number;
  sticker_set_name: string;
  can_set_sticker_set: boolean;
  linked_chat_id: number;
  location: any;
}
