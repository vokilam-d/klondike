import { prop } from '@typegoose/typegoose';
import { EBannerItemType } from '../../shared/enums/banner-item-type.enum';
import { Media } from '../../shared/models/media.model';


export class BannerItem {
  @prop()
  id?: number;

  @prop()
  type: EBannerItemType;

  @prop()
  slug?: string;

  @prop()
  media?: Media;
}
