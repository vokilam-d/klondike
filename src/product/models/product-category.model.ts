import { prop } from '@typegoose/typegoose';

// todo convert product breadcrumbs into ids[], then use this as reference to build them
export class ProductCategory {
  @prop()
  id: number;

  @prop()
  name: string;

  @prop()
  slug: string;

  @prop({ default: 0 })
  sortOrder: number;
}
