import { Expose, Type } from 'class-transformer';
import { AdminResponseCategoryDto } from '../admin/category.dto';

export class CategoryDto extends AdminResponseCategoryDto {
}

export class CategoryTreeItem {
  @Expose()
  id: CategoryDto['id'];

  @Expose()
  name: CategoryDto['name'];

  @Expose()
  slug: CategoryDto['slug'];

  @Expose()
  @Type(() => CategoryTreeItem)
  children: CategoryTreeItem[];

  constructor(value: Partial<CategoryTreeItem>) {
    Object.assign(this, value);
  }
}
