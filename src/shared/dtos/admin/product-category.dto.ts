import { ProductCategory } from '../../../product/models/product-category.model';
import { Expose, Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';

export class AdminProductCategoryDto implements ProductCategory {
  @Expose()
  @IsNumber()
  id: number;

  @Expose()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;

  @Expose()
  slug: string;

  @Expose()
  reversedSortOrder: number;

  @Expose()
  isSortOrderFixed: boolean;

  @Expose()
  reversedSortOrderBeforeFix: number;
}
