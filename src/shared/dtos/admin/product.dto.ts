import { ArrayNotEmpty, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { AdminProductSelectedAttributeDto } from './product-selected-attribute.dto';
import { AdminProductVariantDto } from './product-variant.dto';
import { NoDuplicatesInProductVariants } from '../../validators/no-duplicates-in-product-variants';
import { BreadcrumbDto } from '../shared-dtos/breadcrumb.dto';
import { AdminProductCategoryDto } from './product-category.dto';

export class AdminAddOrUpdateProductDto {
  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminProductCategoryDto)
  categories: AdminProductCategoryDto[];

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => BreadcrumbDto)
  breadcrumbs: BreadcrumbDto[];

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
  @IsOptional()
  createdAt: any;

  @Expose()
  @IsOptional()
  updatedAt: any;
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
