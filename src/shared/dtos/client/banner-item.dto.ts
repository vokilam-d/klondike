import { Expose } from 'class-transformer';
import { EBannerItemType } from '../../enums/banner-item-type.enum';
import { ProductLabelTypeEnum } from '../../enums/product-label-type.enum';
import { ClientMediaDto } from './media.dto';
import { Language } from '../../enums/language.enum';
import { AdminBannerItemDto } from '../admin/banner-item.dto';


export class ClientBannerItemDto implements
  Omit<AdminBannerItemDto, 'media'>,
  Record<keyof Pick<AdminBannerItemDto, 'media'>, ClientMediaDto>
{
  @Expose()
  id: number;

  @Expose()
  type: EBannerItemType;

  @Expose()
  media: ClientMediaDto;

  @Expose()
  slug: string;

  @Expose()
  price: number;

  @Expose()
  oldPrice: number;

  @Expose()
  label: ProductLabelTypeEnum;

  static transformToDto(adminBannerItemDto: AdminBannerItemDto, lang: Language): ClientBannerItemDto {
    return {
      id: adminBannerItemDto.id,
      type: adminBannerItemDto.type,
      media: ClientMediaDto.transformToDto(adminBannerItemDto.media, lang),
      slug: adminBannerItemDto.slug,
      price: adminBannerItemDto.price,
      oldPrice: adminBannerItemDto.oldPrice,
      label: adminBannerItemDto.label
    };
  }
}
