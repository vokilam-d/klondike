import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsString, ValidateNested } from 'class-validator';
import { MediaDto } from './media.dto';
import { MetaTagsDto } from './meta-tags.dto';
import { AdminProductSelectedAttributeDto } from './product-selected-attribute.dto';
import { transliterate } from '../../helpers/transliterate.function';

export class AdminProductVariantDto {
  @Exclude()
  _id: string;

  @Expose()
  @Transform(((value, obj) => value ? value : obj._id && obj._id.toString()))
  id: string;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  sku: string;

  @Expose()
  @IsString()
  @Transform((slug, variant) => slug === '' ? transliterate(variant.name) : slug)
  slug: string;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminProductSelectedAttributeDto)
  attributes: AdminProductSelectedAttributeDto[];

  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @Transform(price => parseFloat(price))
  @IsNumber()
  price: number;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  medias: MediaDto[];

  @Expose()
  @IsString()
  fullDescription: string;

  @Expose()
  @IsString()
  shortDescription: string;

  @Expose()
  @ValidateNested()
  metaTags: MetaTagsDto;

  @Expose()
  @Transform(price => parseFloat(price))
  @IsNumber()
  qty: number;

  @Expose()
  @IsBoolean()
  isDiscountApplicable: boolean;
}
