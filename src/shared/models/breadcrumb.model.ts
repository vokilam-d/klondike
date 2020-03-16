import { prop } from '@typegoose/typegoose';
import { Category } from '../../category/models/category.model';

export class Breadcrumb {
  @prop()
  id: Category['id'];

  @prop()
  name: Category['name'];

  @prop()
  slug: Category['slug'];
}
