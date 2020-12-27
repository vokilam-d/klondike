import { BlogPost } from '../../../blog/models/blog-post.model';
import { ClientLinkedProductDto } from './linked-product.dto';
import { Expose, plainToClass, Type } from 'class-transformer';
import { ClientMediaDto } from './media.dto';
import { ClientMetaTagsDto } from './meta-tags.dto';
import { ClientLinkedBlogPostDto } from './linked-blog-post.dto';
import { ClientLinkedBlogCategoryDto } from './linked-blog-category.dto';
import { Language } from '../../enums/language.enum';

export class ClientBlogPostDto implements
  Pick<BlogPost, 'publishedAt' | 'updatedAt' | 'slug'>,
  Record<keyof Pick<BlogPost, 'linkedProducts' | 'medias'>, any>,
  Record<keyof Pick<BlogPost, 'metaTags'>, ClientMetaTagsDto>,
  Record<keyof Pick<BlogPost, 'linkedPosts'>, ClientLinkedBlogPostDto[]>,
  Record<keyof Pick<BlogPost, 'category'>, ClientLinkedBlogCategoryDto>,
  Record<keyof Pick<BlogPost, 'name' | 'content'>, string>
{

  @Expose()
  @Type(() => ClientLinkedBlogCategoryDto)
  category: ClientLinkedBlogCategoryDto;

  @Expose()
  content: string;

  @Expose()
  @Type(() => ClientLinkedBlogPostDto)
  linkedPosts: ClientLinkedBlogPostDto[];

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

  static transformToDto(blogPost: BlogPost, lang: Language): ClientBlogPostDto {
    return {
      category: ClientLinkedBlogCategoryDto.transformToDto(blogPost.category, lang),
      content: blogPost.content[lang],
      linkedPosts: blogPost.linkedPosts.map(linkedPost => ClientLinkedBlogPostDto.transformToDto(linkedPost, lang)),
      linkedProducts: plainToClass(ClientLinkedProductDto, blogPost.linkedProducts, { excludeExtraneousValues: true }),
      medias: ClientMediaDto.transformToDtosArray(blogPost.medias, lang),
      metaTags: ClientMetaTagsDto.transformToDto(blogPost.metaTags, lang),
      name: blogPost.name[lang],
      slug: blogPost.slug,
      publishedAt: blogPost.publishedAt,
      updatedAt: blogPost.updatedAt
    };
  }
}
