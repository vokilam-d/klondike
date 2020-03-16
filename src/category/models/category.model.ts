import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { MetaTags } from '../../shared/models/meta-tags.model';
import { CategoryAncestor } from './category-ancestor.model';
import { Expose } from 'class-transformer';
import { Breadcrumb } from '../../shared/models/breadcrumb.model';

export class Category {
  @prop()
  _id: number;

  @Expose()
  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop({ required: true })
  name: string;

  @prop({ required: true, unique: true, index: true })
  slug: string; // TODO add validation to spaces, only latin chars, number of chars

  @prop({ default: true })
  isEnabled: boolean;

  @prop({ default: 0 })
  parentId: number;

  @arrayProp({ items: Breadcrumb, _id: false })
  breadcrumbs: Breadcrumb[];

  @arrayProp({ _id: false, items: CategoryAncestor })
  ancestors: CategoryAncestor[];

  @prop({ _id: false })
  metaTags: MetaTags;

  @prop({ default: '' })
  description: string;

  @prop({ default: '' })
  imageUrl: string;

  static collectionName: string = 'category';
}

export const CategoryModel = getModelForClass(Category, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
