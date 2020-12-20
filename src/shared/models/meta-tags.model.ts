import { prop } from '@typegoose/typegoose';
import { Exclude } from 'class-transformer';
import { MultilingualText } from './multilingual-text.model';

export class MetaTags {
  @Exclude()
  @prop()
  _id?: number;

  @Exclude()
  __v?: any;

  @prop({ default: new MultilingualText() })
  title: MultilingualText;

  @prop({ default: new MultilingualText() })
  description: MultilingualText;

  @prop({ default: new MultilingualText() })
  keywords: MultilingualText;
}
