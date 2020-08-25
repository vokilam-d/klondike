import { AdminCategoryDto } from '../admin/category.dto';
import { MetaTagsDto } from '../shared-dtos/meta-tags.dto';
import { Expose, Type } from 'class-transformer';
import { BreadcrumbDto } from '../shared-dtos/breadcrumb.dto';
import { ClientMediaDto } from './media.dto';
import { ClientLinkedCategoryDto } from './linked-category.dto';

export class ClientCategoryDto implements Omit<AdminCategoryDto, 'isEnabled' | 'reversedSortOrder' | 'createRedirect'> {
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
  @Type(() => BreadcrumbDto)
  breadcrumbs: BreadcrumbDto[];

  @Expose()
  @Type(() => ClientMediaDto)
  medias: ClientMediaDto[];

  @Expose()
  @Type(() => ClientLinkedCategoryDto)
  siblingCategories: ClientLinkedCategoryDto[];

  @Expose()
  @Type(() => ClientLinkedCategoryDto)
  childCategories: ClientLinkedCategoryDto[];
}
