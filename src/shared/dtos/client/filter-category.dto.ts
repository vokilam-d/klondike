import { Category } from '../../../category/models/category.model';
import { ClientMediaDto } from './media.dto';
import { Expose, Type } from 'class-transformer';

export class FilterCategoryDto implements
  Pick<Category, 'id' | 'slug'>,
  Record<keyof Pick<Category, 'name'>, string>,
  Record<keyof Pick<Category, 'medias'>, ClientMediaDto[]>
{
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
