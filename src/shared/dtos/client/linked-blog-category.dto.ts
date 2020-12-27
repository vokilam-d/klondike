import { Expose } from 'class-transformer';
import { BaseLinkedBlogCategoryDto } from '../shared-dtos/base-linked-blog-category.dto';
import { LinkedBlogCategory } from '../../../blog/models/linked-blog-category.model';
import { Language } from '../../enums/language.enum';

export class ClientLinkedBlogCategoryDto extends BaseLinkedBlogCategoryDto {
  @Expose()
  name: string;

  static transformToDto(linkedBlogCategory: LinkedBlogCategory, lang: Language): ClientLinkedBlogCategoryDto {
    return {
      id: linkedBlogCategory.id,
      name: linkedBlogCategory.name[lang],
      slug: linkedBlogCategory.slug
    };
  }
}
