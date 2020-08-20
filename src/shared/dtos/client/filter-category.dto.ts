import { Category } from '../../../category/models/category.model';
import { ClientMediaDto } from './media.dto';

export class FilterCategoryDto implements Record<keyof Pick<Category, 'id' | 'name' | 'slug' | 'medias'>, any> {
  id: number;
  medias: ClientMediaDto[];
  name: string;
  slug: string;
}
