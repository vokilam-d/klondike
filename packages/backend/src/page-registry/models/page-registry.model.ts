import { getModelForClass, prop } from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';

export interface BackendPageRegistry extends Partial<Base> { }
export interface BackendPageRegistry extends Partial<TimeStamps> { }

export class BackendPageRegistry {

  @prop({ required: true, index: true})
  slug: string;

  @prop({ required: true })
  type: 'category' | 'product' | 'content';

  static collectionName: string = 'page-registry';
  static model = getModelForClass(BackendPageRegistry);
}
