import { prop } from '@typegoose/typegoose';

export class CategoryAncestor {

  id: string;

  @prop({ required: true })
  name: string;

  @prop({ required: true })
  slug: string;
}
