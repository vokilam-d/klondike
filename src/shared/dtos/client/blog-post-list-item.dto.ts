import { BlogPost } from '../../../blog/models/blog-post.model';
import { LinkedBlogCategoryDto } from '../admin/blog-post.dto';
import { Expose, Type } from 'class-transformer';
import { ClientMediaDto } from './media.dto';

export class ClientBlogPostListItemDto implements Pick<BlogPost, 'name' | 'slug' | 'shortContent' | 'category' | 'publishedAt' | 'updatedAt'>, Record<keyof Pick<BlogPost, 'featuredMedia'>, ClientMediaDto> {
  @Expose()
  @Type(() => LinkedBlogCategoryDto)
  category: LinkedBlogCategoryDto;

  @Expose()
  name: string;

  @Expose()
  publishedAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  shortContent: string;

  @Expose()
  slug: string;

  @Expose()
  @Type(() => ClientMediaDto)
  featuredMedia: ClientMediaDto;
}
