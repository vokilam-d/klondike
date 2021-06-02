import { Expose, Type } from 'class-transformer';
import { ClientMediaDto } from './media.dto';
import { ClientLinkedCategoryDto } from './linked-category.dto';
import { EProductsSort } from '../../enums/product-sort.enum';
import { ClientMetaTagsDto } from './meta-tags.dto';
import { ClientBreadcrumbDto } from './breadcrumb.dto';
import { Category } from '../../../category/models/category.model';
import { Language } from '../../enums/language.enum';

export class ClientCategoryDto implements
  Pick<Category, 'id' | 'parentId' | 'slug' | 'defaultItemsSort'>,
  Record<keyof Pick<Category, 'description' | 'name'>, string>,
  Record<keyof Pick<Category, 'metaTags'>, ClientMetaTagsDto>,
  Record<keyof Pick<Category, 'medias'>, ClientMediaDto[]>
{

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

  static transformToDto(
    category: Category,
    allCategories: Category[],
    lang: Language,
    siblingCategories: ClientLinkedCategoryDto[],
    childCategories: ClientLinkedCategoryDto[]
  ): ClientCategoryDto {
    return {
      breadcrumbs: ClientBreadcrumbDto.transformToDtosArray(category.breadcrumbCategoryIds, allCategories, lang),
      childCategories: childCategories,
      defaultItemsSort: category.defaultItemsSort,
      description: category.description[lang],
      id: category.id,
      medias: ClientMediaDto.transformToDtosArray(category.medias, lang),
      metaTags: ClientMetaTagsDto.transformToDto(category.metaTags, lang),
      name: category.name[lang],
      parentId: category.parentId,
      siblingCategories: siblingCategories,
      slug: category.slug
    };
  }
}
