import { BlogCategory } from '../../../blog/models/blog-category.model';
import { Expose, Type } from 'class-transformer';
import { ClientMetaTagsDto } from './meta-tags.dto';
import { Language } from '../../enums/language.enum';

export class ClientBlogCategoryDto implements Pick<BlogCategory, 'id'>, Record<keyof Pick<BlogCategory, 'metaTags'>, ClientMetaTagsDto>, Record<keyof Pick<BlogCategory, 'name' | 'content'>, string> {

  @Expose()
  content: string;

  @Expose()
  id: number;

  @Expose()
  @Type(() => ClientMetaTagsDto)
  metaTags: ClientMetaTagsDto;

  @Expose()
  name: string;

  static transformToDto(blogCategory: BlogCategory, lang: Language): ClientBlogCategoryDto {
    return {
      content: blogCategory.content[lang],
      id: blogCategory.id,
      metaTags: ClientMetaTagsDto.transformToDto(blogCategory.metaTags, lang),
      name: blogCategory.name[lang]
    };
  }
}
