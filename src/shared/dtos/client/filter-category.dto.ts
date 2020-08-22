import { Category } from '../../../category/models/category.model';
import { ClientMediaDto } from './media.dto';
import { Expose, Type } from 'class-transformer';

export class FilterCategoryDto implements Record<keyof Pick<Category, 'id' | 'name' | 'slug' | 'medias'>, any> {
  @Expose()
  id: number;

  @Expose()
  @Type(() => ClientMediaDto)
  medias: ClientMediaDto[];

  @Expose()
  name: string;

  @Expose()
  slug: string;
}
