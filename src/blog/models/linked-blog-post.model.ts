import { prop } from '@typegoose/typegoose';

export class LinkedBlogPost {
  @prop()
  id: number;

  @prop()
  name: string;

  @prop()
  slug: string;

  @prop({ default: 0 })
  sortOrder: number;
}
