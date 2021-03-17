import { Expose, Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { EBannerItemType } from '../../enums/banner-item-type.enum';
import { AdminMediaDto } from './media.dto';
import { TrimString } from '../../decorators/trim-string.decorator';
import { transliterate } from '../../helpers/transliterate.function';
import { clientDefaultLanguage } from '../../constants';
import { AdminAddOrUpdateProductVariantDto } from './product-variant.dto';
import { ProductLabelTypeEnum } from '../../enums/product-label-type.enum';


export class AdminBannerItemDto {
  @Expose()
  id: number;

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
  label: ProductLabelTypeEnum;
}
