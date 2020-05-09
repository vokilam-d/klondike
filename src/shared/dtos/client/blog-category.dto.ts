import { BlogCategory } from '../../../blog/models/blog-category.model';
import { MetaTagsDto } from '../shared-dtos/meta-tags.dto';
import { Expose, Type } from 'class-transformer';

export class ClientBlogCategoryDto implements Pick<BlogCategory, 'id' | 'name' | 'content' | 'metaTags'> {
  @Expose()
  content: string;

  @Expose()
  id: number;

  @Expose()
  @Type(() => MetaTagsDto)
  metaTags: MetaTagsDto;

  @Expose()
  name: string;
}
