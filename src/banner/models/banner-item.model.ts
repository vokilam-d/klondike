import { prop } from '@typegoose/typegoose';
import { EBannerItemType } from '../../shared/enums/banner-item-type.enum';


export class BannerItem {
  @prop()
  id: number;

  @prop()
  type: EBannerItemType;
}
