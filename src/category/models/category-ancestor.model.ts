import { prop } from '@typegoose/typegoose';

export class BackendCategoryAncestor {

  id: string;

  @prop({ required: true })
  name: string;

  @prop({ required: true })
  slug: string;
}
