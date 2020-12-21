import { BlogCategory } from '../../../blog/models/blog-category.model';
import { Expose } from 'class-transformer';
import { Language } from '../../enums/language.enum';

export class ClientBlogCategoryListItemDto implements Pick<BlogCategory, 'slug'>, Record<keyof Pick<BlogCategory, 'name'>, string> {
  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  postsCount: number;

  static transformToDto(blogCategory: BlogCategory, lang: Language, postsCount: number): ClientBlogCategoryListItemDto {
    return {
      name: blogCategory.name[lang],
      slug: blogCategory.slug,
      postsCount
    };
  }
}
