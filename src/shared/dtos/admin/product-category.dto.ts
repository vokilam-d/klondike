import { ProductCategory } from '../../../product/models/product-category.model';
import { Expose } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';

export class AdminProductCategoryDto implements Required<ProductCategory> {
  @Expose()
  @IsNumber()
  id: number;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  name: string;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  slug: string;

  @Expose()
  @IsOptional()
  @IsNumber()
  sortOrder: number;
}
