import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { BackendMetaTags } from '../../shared/models/meta-tags.model';
import { BackendCategoryAncestor } from './category-ancestor.model';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';


export interface BackendCategory extends Base { }
export interface BackendCategory extends TimeStamps { }

export class BackendCategory {

  @prop({ required: true })
  name: string;

  @prop({ required: true, unique: true, index: true })
  slug: string; // TODO add validation to spaces, only latin chars, number of chars

  @prop({ default: true })
  isEnabled: boolean;

  @prop({ default: null })
  parentId: string;

  @arrayProp({ _id: false, items: BackendCategoryAncestor })
  ancestors?: BackendCategoryAncestor[];

  @prop({ _id: false })
  meta?: BackendMetaTags;

  @prop()
  description?: string;

  @prop()
  imageUrl?: string;

  static collectionName: string = 'category';
  static model = getModelForClass(BackendCategory);
}
