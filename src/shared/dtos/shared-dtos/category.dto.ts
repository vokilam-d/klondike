import { Expose, Type } from 'class-transformer';
import { AdminCategoryDto } from '../admin/category.dto';

export class CategoryDto extends AdminCategoryDto {
}

export class CategoryTreeItem {
  @Expose()
  id: CategoryDto['id'];

  @Expose()
  name: CategoryDto['name'];

  @Expose()
  slug: CategoryDto['slug'];

  @Expose()
  parentId: CategoryDto['parentId'];

  @Expose()
  reversedSortOrder: CategoryDto['reversedSortOrder'];

  @Expose()
  @Type(() => CategoryTreeItem)
  children: CategoryTreeItem[];

  constructor(value: Partial<CategoryTreeItem>) {
    Object.assign(this, value);
  }
}
