import { Expose, Type } from 'class-transformer';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';
import { AdminProductCategoryDto } from './product-category.dto';

export class AdminProductListItemCategoryDto extends AdminProductCategoryDto {
  @Expose()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;

  @Expose()
  slug: string;
}
