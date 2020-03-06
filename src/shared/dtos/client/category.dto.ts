import { AdminResponseCategoryDto } from '../admin/category.dto';
import { MetaTagsDto } from '../shared/meta-tags.dto';
import { Expose } from 'class-transformer';

export class ClientCategoryDto implements Omit<AdminResponseCategoryDto, 'isEnabled'> {
  @Expose()
  description: string;

  @Expose()
  id: number;

  @Expose()
  metaTags: MetaTagsDto;

  @Expose()
  name: string;

  @Expose()
  parentId: number;

  @Expose()
  slug: string;
}
