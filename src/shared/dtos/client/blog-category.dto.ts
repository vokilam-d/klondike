import { BlogCategory } from '../../../blog/models/blog-category.model';
import { Expose, Type } from 'class-transformer';
import { ClientMetaTagsDto } from './meta-tags.dto';

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
}
