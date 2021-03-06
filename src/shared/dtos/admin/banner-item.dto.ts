import { Expose, Type } from 'class-transformer';
import { EBannerItemType } from '../../enums/banner-item-type.enum';
import { AdminMediaDto } from './media.dto';
import { ProductLabelTypeEnum } from '../../enums/product-label-type.enum';


export class AdminBannerItemDto {
  @Expose()
  id?: number;

  @Expose()
  type: EBannerItemType;

  @Expose()
  @Type(() => AdminMediaDto)
  media: AdminMediaDto;

  @Expose()
  slug: string;

  @Expose()
  price: number;

  @Expose()
  oldPrice: number;

  @Expose()
  label: {
    type: ProductLabelTypeEnum,
    text: string
  };
}
