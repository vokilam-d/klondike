import { BlogPost } from '../../../blog/models/blog-post.model';
import { LinkedBlogCategoryDto, LinkedBlogPostDto } from '../admin/blog-post.dto';
import { ClientLinkedProductDto } from './linked-product.dto';
import { MediaDto } from '../shared-dtos/media.dto';
import { MetaTags } from '../../models/meta-tags.model';
import { Expose } from 'class-transformer';

export class ClientBlogPostDto implements Pick<BlogPost, 'category' | 'content' | 'name' | 'metaTags' | 'linkedPosts' | 'publishedAt'>, Record<keyof Pick<BlogPost, 'linkedProducts' | 'medias'>, any> {

  @Expose()
  category: LinkedBlogCategoryDto;

  @Expose()
  content: string;

  @Expose()
  linkedPosts: LinkedBlogPostDto[];

  @Expose()
  linkedProducts: ClientLinkedProductDto[];

  @Expose()
  medias: MediaDto[];

  @Expose()
  metaTags: MetaTags;

  @Expose()
  name: string;

  @Expose()
  publishedAt: Date;
}
