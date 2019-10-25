import { arrayProp, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { MetaTags } from '../../shared/models/meta-tags.model';
import { CategoryAncestor } from './category-ancestor.model';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';


export interface Category extends Base { }
export interface Category extends TimeStamps { }

export class Category {

  @prop({ required: true })
  name: string;

  @prop({ required: true, unique: true, index: true })
  slug: string; // TODO add validation to spaces, only latin chars, number of chars

  @prop({ default: true })
  isEnabled: boolean;

  @prop({ default: null })
  parentId: string;

  @arrayProp({ _id: false, items: CategoryAncestor })
  ancestors?: CategoryAncestor[];

  @prop({ _id: false })
  meta?: MetaTags;

  @prop()
  description?: string;

  @prop()
  imageUrl?: string;

  static collectionName: string = 'category';
  static model = getModelForClass(Category);
}
