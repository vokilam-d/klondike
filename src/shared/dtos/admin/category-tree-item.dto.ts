import { BaseCategoryTreeItemDto } from '../shared-dtos/base-category.dto';
import { Expose, Type } from 'class-transformer';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';

export class AdminCategoryTreeItemDto extends BaseCategoryTreeItemDto {
  @Expose()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;

  @Expose()
  @Type(() => AdminCategoryTreeItemDto)
  children: BaseCategoryTreeItemDto[];
}
