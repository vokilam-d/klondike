import { Expose } from 'class-transformer';
import { BaseBreadcrumbDto } from '../shared-dtos/base-breadcrumb.dto';
import { Language } from '../../enums/language.enum';
import { Category } from '../../../category/models/category.model';

export class ClientBreadcrumbDto extends BaseBreadcrumbDto {
  @Expose()
  name: string;

  static transformToDtosArray(categoryIds: number[], allCategories: Category[], lang: Language): ClientBreadcrumbDto[] {
    return categoryIds
      .map(categoryId => allCategories.find(category => category.id === categoryId))
      .filter(category => category?.isEnabled)
      .map(category => ClientBreadcrumbDto.transformToDto(category, lang));
  }

  static transformToDto(category: Category, lang: Language): ClientBreadcrumbDto {
    return {
      id: category.id,
      name: category.name[lang],
      slug: category.slug
    };
  }
}
