import { prop } from '@typegoose/typegoose';
import { Exclude } from 'class-transformer';
import { MultilingualText } from './multilingual-text.model';

export class MetaTags {
  @Exclude()
  @prop()
  _id?: number;

  @Exclude()
  __v?: any;

  @prop({ default: new MultilingualText(), _id: false })
  title: MultilingualText;

  @prop({ default: new MultilingualText(), _id: false })
  description: MultilingualText;

  @prop({ default: new MultilingualText(), _id: false })
  keywords: MultilingualText;
}
