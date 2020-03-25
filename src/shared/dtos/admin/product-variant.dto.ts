import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AdminMediaDto } from './media.dto';
import { AdminProductSelectedAttributeDto } from './product-selected-attribute.dto';
import { transliterate } from '../../helpers/transliterate.function';
import { ECurrencyCode } from '../../enums/currency.enum';
import { MetaTagsDto } from '../shared-dtos/meta-tags.dto';

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
  @IsOptional()
  @IsString()
  vendorCode: string;

  @Expose()
  @IsOptional()
  @IsString()
  gtin: string;

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
  @IsEnum(ECurrencyCode)
  currency: ECurrencyCode;

  @Expose()
  @IsOptional()
  @IsNumber()
  priceInDefaultCurrency: number;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminMediaDto)
  medias: AdminMediaDto[];

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

  @Expose()
  @IsOptional()
  @IsNumber()
  salesCount: number;

  @Expose()
  @IsOptional()
  @IsString()
  googleAdsProductTitle: string;
}
