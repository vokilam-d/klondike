import { BlogPost } from '../../../blog/models/blog-post.model';
import { Expose, Type } from 'class-transformer';
import { ClientMediaDto } from './media.dto';
import { Language } from '../../enums/language.enum';
import { ClientLinkedBlogCategoryDto } from './linked-blog-category.dto';

export class ClientBlogPostListItemDto implements
  Pick<BlogPost, 'slug' | 'publishedAt' | 'updatedAt'>,
  Record<keyof Pick<BlogPost, 'featuredMedia'>, ClientMediaDto>,
  Record<keyof Pick<BlogPost, 'category'>, ClientLinkedBlogCategoryDto>,
  Record<keyof Pick<BlogPost, 'name' | 'shortContent'>, string>
{
  @Expose()
  @Type(() => ClientLinkedBlogCategoryDto)
  category: ClientLinkedBlogCategoryDto;

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

  static transformToDto(blogPost: BlogPost, lang: Language): ClientBlogPostListItemDto {
    return {
      category: ClientLinkedBlogCategoryDto.transformToDto(blogPost.category, lang),
      name: blogPost.name[lang],
      publishedAt: blogPost.publishedAt,
      updatedAt: blogPost.updatedAt,
      shortContent: blogPost.shortContent[lang],
      slug: blogPost.slug,
      featuredMedia: blogPost.featuredMedia ? ClientMediaDto.transformToDto(blogPost.featuredMedia, lang) : undefined
    }
  }
}
