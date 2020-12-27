import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { MetaTags } from '../../shared/models/meta-tags.model';
import { Expose } from 'class-transformer';
import { Breadcrumb } from '../../shared/models/breadcrumb.model';
import { Media } from '../../shared/models/media.model';
import { EProductsSort } from '../../shared/enums/product-sort.enum';
import { MultilingualText } from '../../shared/models/multilingual-text.model';

export class Category {
  @prop()
  _id: number;

  @Expose()
  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop({ required: true, _id: false })
  name: MultilingualText;

  @prop({ required: true, unique: true, index: true })
  slug: string;

  @prop({ default: true })
  isEnabled: boolean;

  @prop({ default: 0 })
  parentId: number;

  @arrayProp({ items: Breadcrumb, _id: false })
  breadcrumbs: Breadcrumb[];

  @prop({ _id: false })
  metaTags: MetaTags;

  @prop({ default: new MultilingualText(), _id: false })
  description: MultilingualText;

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
