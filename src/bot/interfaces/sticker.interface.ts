export interface ITelegramSticker {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  is_animated: boolean;
  thumb?: any;
  emoji?: string;
  set_name?: string;
  mask_position?: any;
  file_size?: number;
}
