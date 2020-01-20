import { ArrayNotEmpty, IsBoolean, IsDefined, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { AdminProductSelectedAttributeDto } from './product-selected-attribute.dto';
import { AdminProductVariantDto } from './product-variant.dto';
import { NoDuplicatesInProductVariants } from '../../validators/no-duplicates-in-product-variants';

export class AdminAddOrUpdateProductDto {
  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsNumber(undefined, { each: true })
  categoryIds: number[];

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminProductSelectedAttributeDto)
  attributes: AdminProductSelectedAttributeDto[];

  @Expose()
  @ArrayNotEmpty()
  @NoDuplicatesInProductVariants()
  @ValidateNested({ each: true })
  @Type(() => AdminProductVariantDto)
  variants: AdminProductVariantDto[];

  @Expose()
  @IsNumber()
  sortOrder: number;
}

export class AdminProductDto extends AdminAddOrUpdateProductDto {
  @Exclude()
  _id: number;

  @Expose()
  @Transform(((value, obj) => value ? value : obj._id && obj._id.toString()))
  id: number;
}
