import { prop } from '@typegoose/typegoose';

export class BackendMetaTags {

  @prop()
  title: string;

  @prop()
  description: string;

  @prop()
  keywords: string;
}
