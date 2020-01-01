import { Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsDefined, IsNumber, IsString, ValidateNested } from 'class-validator';
import { MediaDto } from './media.dto';
import { MetaTagsDto } from './meta-tags.dto';
import { AdminProductSelectedAttributeDto } from './product-selected-attribute.dto';
import { transliterate } from '../../helpers/transliterate.function';

export class AdminProductVariantDto {
  @Expose()
  @Transform(((value, obj) => value ? value : obj._id && obj._id.toString()))
  id: string;

  @Expose()
  @IsDefined()
  @IsString()
  name: string;

  @Expose()
  @IsDefined()
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
  @IsNumber()
  qty: number;
}
