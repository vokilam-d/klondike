import { Category } from '../../../category/models/category.model';
import { ClientMediaDto } from './media.dto';
import { Expose, Type } from 'class-transformer';
import { Language } from '../../enums/language.enum';

export class ClientLinkedCategoryDto implements Record<keyof Pick<Category, 'id' | 'name' | 'slug' | 'medias'>, any> {
  @Expose()
  id: number;

  @Expose()
  @Type(() => ClientMediaDto)
  medias: ClientMediaDto[];

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  isSelected: boolean;

  static transformToDto(category: Category, lang: Language, isSelected?: boolean): ClientLinkedCategoryDto {
    return {
      id: category.id,
      isSelected,
      medias: ClientMediaDto.transformToDtosArray(category.medias, lang),
      name: category.name[lang],
      slug: category.slug
    };
  }
}
