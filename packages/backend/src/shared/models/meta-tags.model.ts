import { prop } from '@typegoose/typegoose';
import { Exclude } from 'class-transformer';

export class BackendMetaTags {
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
