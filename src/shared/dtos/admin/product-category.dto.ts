import { ProductCategory } from '../../../product/models/product-category.model';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class AdminProductCategoryDto implements ProductCategory {
  @Expose()
  @IsNumber()
  id: number;

  @Expose()
  reversedSortOrder: number;

  @Expose()
  isSortOrderFixed: boolean;

  @Expose()
  reversedSortOrderBeforeFix: number;
}
