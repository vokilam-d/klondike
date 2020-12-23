import { BaseCategoryTreeItemDto } from '../shared-dtos/base-category.dto';
import { Expose, Type } from 'class-transformer';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';
import { AdminMediaDto } from './media.dto';

export class AdminCategoryTreeItemDto extends BaseCategoryTreeItemDto {
  @Expose()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;

  @Expose()
  @Type(() => AdminCategoryTreeItemDto)
  children: AdminCategoryTreeItemDto[];


  @Expose()
  @Type(() => AdminMediaDto)
  medias: AdminMediaDto[];
}
