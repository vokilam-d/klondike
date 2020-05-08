import { BlogCategory } from '../../../blog/models/blog-category.model';
import { Expose } from 'class-transformer';

export class ClientBlogCategoryListItemDto implements Pick<BlogCategory, 'name' | 'slug'> {
  @Expose()
  name: string;

  @Expose()
  slug: string;
}
