import { prop } from '@typegoose/typegoose';
import { Exclude } from 'class-transformer';

export class MetaTags {
  @Exclude()
  @prop()
  _id: number;

  @Exclude()
  __v: any;

  @prop()
  title: string;

  @prop()
  description: string;

  @prop()
  keywords: string;
}
