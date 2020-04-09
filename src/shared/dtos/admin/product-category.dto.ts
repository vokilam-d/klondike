import { ProductCategory } from '../../../product/models/product-category.model';
import { Expose } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AdminProductCategoryDto implements Required<ProductCategory> {
  @Expose()
  @IsNumber()
  id: number;

  @Expose()
  @IsOptional()
  @IsString()
  name: string;

  @Expose()
  @IsOptional()
  @IsString()
  slug: string;

  @Expose()
  @IsOptional()
  @IsNumber()
  sortOrder: number;
}
