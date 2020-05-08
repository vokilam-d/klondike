import { prop } from '@typegoose/typegoose';

export class LinkedBlogCategory {
  @prop({ index: true })
  id: number;

  @prop()
  name: string;

  @prop()
  slug: string;
}
