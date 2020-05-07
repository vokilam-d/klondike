import { prop } from '@typegoose/typegoose';
import { Exclude } from 'class-transformer';

export class MetaTags {
  @Exclude()
  @prop()
  _id?: number;

  @Exclude()
  __v?: any;

  @prop({ default: '' })
  title: string;

  @prop({ default: '' })
  description: string;

  @prop({ default: '' })
  keywords: string;
}
