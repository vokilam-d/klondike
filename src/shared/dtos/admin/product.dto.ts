import { MetaTagsDto } from './meta-tags.dto';
import { IsBoolean, IsDefined, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { MediaDto } from './media.dto';

export class AdminAddOrUpdateProductDto {
  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @IsDefined()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  slug: string;

  @Expose()
  @IsString()
  sku: string;

  @Expose()
  @IsNumber()
  qty: number;

  @Expose()
  @IsNumber()
  price: number;

  @Expose()
  @IsString()
  shortDescription: string;

  @Expose()
  @IsString()
  fullDescription: string;

  @Expose()
  @IsNumber(undefined, { each: true })
  categoryIds: number[];

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  medias: MediaDto[];

  @Expose()
  @ValidateNested()
  metaTags: MetaTagsDto;
}

export class AdminResponseProductDto extends AdminAddOrUpdateProductDto {
  @Expose()
  id: number;
}
