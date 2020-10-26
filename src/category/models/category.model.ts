import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { MetaTags } from '../../shared/models/meta-tags.model';
import { Expose } from 'class-transformer';
import { Breadcrumb } from '../../shared/models/breadcrumb.model';
import { Media } from '../../shared/models/media.model';
import { EProductsSort } from '../../shared/enums/product-sort.enum';

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

  @prop({ _id: false })
  metaTags: MetaTags;

  @prop({ default: '' })
  description: string;

  @prop({ default: '' })
  imageUrl: string;

  @prop({ default: 0 })
  reversedSortOrder: number;

  @arrayProp({ items: Media, default: [] })
  medias: Media[];

  @prop({ enum: EProductsSort })
  defaultItemsSort: EProductsSort;

  @prop({ default: null })
  canonicalCategoryId: number;

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
