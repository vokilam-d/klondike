import { prop } from '@typegoose/typegoose';
import { MultilingualText } from '../../shared/models/multilingual-text.model';

export class LinkedBlogCategory {
  @prop({ index: true })
  id: number;

  @prop({ _id: false })
  name: MultilingualText;

  @prop()
  slug: string;
}
