import { BlogPost } from '../../../blog/models/blog-post.model';
import { LinkedBlogCategoryDto, LinkedBlogPostDto } from '../admin/blog-post.dto';
import { ClientLinkedProductDto } from './linked-product.dto';
import { Expose, Type } from 'class-transformer';
import { ClientMediaDto } from './media.dto';
import { ClientMetaTagsDto } from './meta-tags.dto';

export class ClientBlogPostDto implements
  Pick<BlogPost, 'category' | 'linkedPosts' | 'publishedAt' | 'updatedAt' | 'slug'>,
  Record<keyof Pick<BlogPost, 'linkedProducts' | 'medias'>, any>,
  Record<keyof Pick<BlogPost, 'metaTags'>, ClientMetaTagsDto>,
  Record<keyof Pick<BlogPost, 'name' | 'content'>, string> {

  @Expose()
  @Type(() => LinkedBlogCategoryDto)
  category: LinkedBlogCategoryDto;

  @Expose()
  content: string;

  @Expose()
  @Type(() => LinkedBlogPostDto)
  linkedPosts: LinkedBlogPostDto[];

  @Expose()
  @Type(() => ClientLinkedProductDto)
  linkedProducts: ClientLinkedProductDto[];

  @Expose()
  @Type(() => ClientMediaDto)
  medias: ClientMediaDto[];

  @Expose()
  @Type(() => ClientMetaTagsDto)
  metaTags: ClientMetaTagsDto;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  publishedAt: Date;

  @Expose()
  updatedAt: Date;
}
