import { prop } from '@typegoose/typegoose';

export class MetaTags {

  @prop()
  title?: string;

  @prop()
  description?: string;

  @prop()
  keywords?: string;
}
