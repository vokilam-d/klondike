import { ArrayNotEmpty, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { AdminProductSelectedAttributeDto } from './product-selected-attribute.dto';
import { AdminAddOrUpdateProductVariantDto } from './product-variant.dto';
import { NoDuplicatesInProductVariants } from '../../validators/no-duplicates-in-product-variants';
import { AdminProductCategoryDto } from './product-category.dto';
import { TrimString } from '../../decorators/trim-string.decorator';
import { AdminBreadcrumbDto } from './breadcrumb.dto';

export class AdminAddOrUpdateProductDto {
  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @IsString()
  @TrimString()
  name: string;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminProductCategoryDto)
  categories: AdminProductCategoryDto[];

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminBreadcrumbDto)
  breadcrumbs: AdminBreadcrumbDto[];

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminProductSelectedAttributeDto)
  attributes: AdminProductSelectedAttributeDto[];

  @Expose()
  @ArrayNotEmpty()
  @NoDuplicatesInProductVariants()
  @ValidateNested({ each: true })
  @Type(() => AdminAddOrUpdateProductVariantDto)
  variants: AdminAddOrUpdateProductVariantDto[];

  @Expose()
  @IsOptional()
  createdAt: any;

  @Expose()
  @IsOptional()
  updatedAt: any;

  @Expose()
  @IsNumber(undefined, { each: true })
  @IsOptional()
  additionalServiceIds: number[];
}

export class AdminProductDto extends AdminAddOrUpdateProductDto {
  @Exclude()
  _id: number;

  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id: number;

  @Expose()
  reviewsCount: number;

  @Expose()
  reviewsAvgRating: number;
}
