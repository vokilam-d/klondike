import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';

export interface PageRegistry extends Partial<Base> { }
export interface PageRegistry extends Partial<TimeStamps> { }

export class PageRegistry {

  @prop({ required: true, index: true})
  slug: string;

  @prop({ required: true })
  type: 'category' | 'product' | 'content';

  static collectionName: string = 'page-registry';
  static model = getModelForClass(PageRegistry);
}
