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
  @IsNumber()
  id: number;

  @Expose()
  @IsEnum(EBannerItemType)
  type: EBannerItemType;

  @Expose()
  @Type(() => AdminMediaDto)
  media: AdminMediaDto;

  @Expose()
  @IsString()
  @TrimString()
  @Transform((slug, variant: AdminAddOrUpdateProductVariantDto) => transliterate(slug || variant.name[clientDefaultLanguage]))
  slug: string;

  @Expose()
  @IsOptional()
  @Transform(price => parseFloat(price))
  @IsNumber()
  price: number;

  @Expose()
  @IsOptional()
  @Transform(oldPrice => oldPrice ? parseFloat(oldPrice) : oldPrice)
  @IsNumber()
  oldPrice: number;

  @Expose()
  @IsOptional()
  @IsEnum(ProductLabelTypeEnum)
  label: ProductLabelTypeEnum;
}
