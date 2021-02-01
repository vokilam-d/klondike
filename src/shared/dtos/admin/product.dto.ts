import { ArrayNotEmpty, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { AdminProductSelectedAttributeDto } from './product-selected-attribute.dto';
import { AdminAddOrUpdateProductVariantDto } from './product-variant.dto';
import { NoDuplicatesInProductVariants } from '../../validators/no-duplicates-in-product-variants';
import { AdminProductCategoryDto } from './product-category.dto';
import { TrimString } from '../../decorators/trim-string.decorator';
import { AdminBreadcrumbDto } from './breadcrumb.dto';
import { Product } from '../../../product/models/product.model';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';

type PickedProduct = Pick<Product, 'isEnabled' | 'name' | 'categories' | 'breadcrumbs' | 'attributes' | 'createdAt' | 'updatedAt' | 'additionalServiceIds' | 'note'>;
type VariantsProp = Record<keyof Pick<Product, 'variants'>, AdminAddOrUpdateProductVariantDto[]>;
export class AdminAddOrUpdateProductDto implements PickedProduct, VariantsProp {
  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;

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
  createdAt: Date;

  @Expose()
  @IsOptional()
  updatedAt: Date;

  @Expose()
  @IsNumber(undefined, { each: true })
  @IsOptional()
  additionalServiceIds: number[];

  @Expose()
  @IsString()
  @TrimString()
  note: string;
}

export class AdminProductDto extends AdminAddOrUpdateProductDto implements Pick<Product, 'id' | 'reviewsAvgRating'> {
  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id: number;

  @Expose()
  reviewsCount: number;

  @Expose()
  reviewsAvgRating: number;
}
