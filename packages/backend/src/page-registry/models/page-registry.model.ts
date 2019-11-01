import { getModelForClass, prop } from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';

export class BackendPageRegistry {

  @prop({ required: true, index: true})
  slug: string;

  @prop({ required: true })
  type: 'category' | 'product' | 'content';

  static collectionName: string = 'page-registry';
}

export const BackendPageModel = getModelForClass(BackendPageRegistry);
