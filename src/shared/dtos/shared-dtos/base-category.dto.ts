import { Expose, Type } from 'class-transformer';
import { BaseMediaDto } from './base-media.dto';
import { Category } from '../../../category/models/category.model';
import { MultilingualTextDto } from './multilingual-text.dto';

export abstract class BaseCategoryTreeItemDto implements Pick<Category, 'id' | 'slug' | 'isEnabled' | 'parentId' | 'reversedSortOrder'> {

  @Expose()
  id: Category['id'];

  abstract name: MultilingualTextDto | string;

  @Expose()
  slug: Category['slug'];

  @Expose()
  isEnabled: Category['isEnabled'];

  @Expose()
  parentId: Category['parentId'];

  @Expose()
  reversedSortOrder: Category['reversedSortOrder'];

  abstract children: BaseCategoryTreeItemDto[];

  @Expose()
  @Type(() => BaseMediaDto)
  medias: BaseMediaDto[];
}
