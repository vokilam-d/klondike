import { BlogPost } from '../../../blog/models/blog-post.model';
import { LinkedBlogCategoryDto } from '../admin/blog-post.dto';
import { Expose } from 'class-transformer';

export class ClientBlogPostListItemDto implements Pick<BlogPost, 'name' | 'slug' | 'shortContent' | 'category' | 'publishedAt'> {
  @Expose()
  category: LinkedBlogCategoryDto;

  @Expose()
  name: string;

  @Expose()
  publishedAt: Date;

  @Expose()
  shortContent: string;

  @Expose()
  slug: string;
}
