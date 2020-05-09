import { BlogPost } from '../../../blog/models/blog-post.model';
import { LinkedBlogCategoryDto, LinkedBlogPostDto } from '../admin/blog-post.dto';
import { ClientLinkedProductDto } from './linked-product.dto';
import { Expose, Type } from 'class-transformer';
import { MetaTagsDto } from '../shared-dtos/meta-tags.dto';
import { ClientMediaDto } from './media.dto';

export class ClientBlogPostDto implements Pick<BlogPost, 'category' | 'content' | 'name' | 'metaTags' | 'linkedPosts' | 'publishedAt' | 'updatedAt' | 'slug'>, Record<keyof Pick<BlogPost, 'linkedProducts' | 'medias'>, any> {

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
  @Type(() => MetaTagsDto)
  metaTags: MetaTagsDto;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  publishedAt: Date;

  @Expose()
  updatedAt: Date;
}
