import { ICategoryAncestor } from '../../../../shared/models/category.interface';
import { prop } from 'typegoose';

export class CategoryAncestor implements ICategoryAncestor {

  id: string;

  @prop({ required: true })
  name: string;

  @prop({ required: true })
  slug: string;
}