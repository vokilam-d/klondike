import { prop } from '@typegoose/typegoose';
import { MultilingualText } from '../../shared/models/multilingual-text.model';

export class LinkedBlogPost {
  @prop()
  id: number;

  @prop({ _id: false })
  name: MultilingualText;

  @prop()
  slug: string;

  @prop({ default: 0 })
  sortOrder: number;
}
