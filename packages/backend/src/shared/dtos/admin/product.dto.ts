import { MetaTagsDto } from './meta-tags.dto';
import { IsBoolean, IsDefined, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Expose } from 'class-transformer';

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
  @IsString({ each: true })
  mediaUrls: number[];

  @Expose()
  @ValidateNested()
  metaTags: MetaTagsDto;
}

export class AdminResponseProductDto extends AdminAddOrUpdateProductDto {
  @Expose()
  id: number;
}
