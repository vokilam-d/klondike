import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { BackendMetaTags } from '../../shared/models/meta-tags.model';
import { BackendCategoryAncestor } from './category-ancestor.model';

export class BackendCategory {
  @prop()
  _id: number;

  get id() { return this._id; }
  set id(id: number) { this._id = id; }

  @prop({ required: true })
  name: string;

  @prop({ required: true, unique: true, index: true })
  slug: string; // TODO add validation to spaces, only latin chars, number of chars

  @prop({ default: true })
  isEnabled: boolean;

  @prop({ default: 0 })
  parentId: number;

  @arrayProp({ _id: false, items: BackendCategoryAncestor })
  ancestors: BackendCategoryAncestor[];

  @prop({ _id: false })
  metaTags: BackendMetaTags;

  @prop({ default: '' })
  description: string;

  @prop({ default: '' })
  imageUrl: string;

  static collectionName: string = 'category';
}

export const BackendCategoryModel = getModelForClass(BackendCategory);
// export const BackendCategoryCollectionName = 'category';
