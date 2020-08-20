import { AdminCategoryDto } from '../admin/category.dto';
import { MetaTagsDto } from '../shared-dtos/meta-tags.dto';
import { Expose } from 'class-transformer';
import { BreadcrumbDto } from '../shared-dtos/breadcrumb.dto';

export class ClientCategoryDto implements Omit<AdminCategoryDto, 'isEnabled' | 'reversedSortOrder'> {
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

  @Expose()
  breadcrumbs: BreadcrumbDto[];
}
