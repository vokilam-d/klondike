import { Expose, Type } from 'class-transformer';
import { ClientMediaDto } from './media.dto';
import { ClientLinkedCategoryDto } from './linked-category.dto';
import { EProductsSort } from '../../enums/product-sort.enum';
import { ClientMetaTagsDto } from './meta-tags.dto';
import { ClientBreadcrumbDto } from './breadcrumb.dto';
import { Category } from '../../../category/models/category.model';

export class ClientCategoryDto implements
  Pick<Category, 'id' | 'parentId' | 'slug' | 'defaultItemsSort'>,
  Record<keyof Pick<Category, 'description' | 'name'>, string>,
  Record<keyof Pick<Category, 'breadcrumbs'>, ClientBreadcrumbDto[]>,
  Record<keyof Pick<Category, 'metaTags'>, ClientMetaTagsDto>,
  Record<keyof Pick<Category, 'medias'>, ClientMediaDto[]> {

  @Expose()
  description: string;

  @Expose()
  id: number;

  @Expose()
  metaTags: ClientMetaTagsDto;

  @Expose()
  name: string;

  @Expose()
  parentId: number;

  @Expose()
  slug: string;

  @Expose()
  @Type(() => ClientBreadcrumbDto)
  breadcrumbs: ClientBreadcrumbDto[];

  @Expose()
  @Type(() => ClientMediaDto)
  medias: ClientMediaDto[];

  @Expose()
  @Type(() => ClientLinkedCategoryDto)
  siblingCategories: ClientLinkedCategoryDto[];

  @Expose()
  @Type(() => ClientLinkedCategoryDto)
  childCategories: ClientLinkedCategoryDto[];

  @Expose()
  defaultItemsSort: EProductsSort;
}
