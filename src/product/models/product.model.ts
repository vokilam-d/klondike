import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { Category } from '../../category/models/category.model';
import { ProductVariant } from './product-variant.model';
import { ProductSelectedAttribute } from './product-selected-attribute.model';
import { Breadcrumb } from '../../shared/models/breadcrumb.model';
import { ProductCategory } from './product-category.model';

export class Product {
  @prop()
  _id: number;

  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop({ default: true })
  isEnabled: boolean;

  @prop({ required: true })
  name: string;

  @arrayProp({ items: ProductCategory, _id: false })
  categories: ProductCategory[];

  @arrayProp({ items: Breadcrumb, _id: false })
  breadcrumbs: Breadcrumb[];

  @arrayProp({ items: ProductSelectedAttribute, _id: false })
  attributes: ProductSelectedAttribute[];

  @arrayProp({ items: ProductVariant, _id: true })
  variants: ProductVariant[];

  @prop({ default: 0 })
  allReviewsCount: number;

  @prop({ default: 0 })
  textReviewsCount: number;

  @prop({ min: 1, max: 5, default: null })
  reviewsAvgRating: number;

  @prop({ default: 0 })
  viewsCount: number;

  createdAt: Date;
  updatedAt: Date;

  static collectionName: string = 'product';
}

export const ProductModel = getModelForClass(Product, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
