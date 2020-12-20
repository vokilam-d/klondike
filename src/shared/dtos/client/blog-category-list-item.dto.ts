import { BlogCategory } from '../../../blog/models/blog-category.model';
import { Expose } from 'class-transformer';

export class ClientBlogCategoryListItemDto implements Pick<BlogCategory, 'slug'>, Record<keyof Pick<BlogCategory, 'name'>, string> {
  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  postsCount: number;
}
