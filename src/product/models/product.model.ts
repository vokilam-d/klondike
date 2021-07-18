import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { ProductVariant } from './product-variant.model';
import { ProductSelectedAttribute } from './product-selected-attribute.model';
import { ProductCategory } from './product-category.model';
import { MultilingualText } from '../../shared/models/multilingual-text.model';
import { BreadcrumbsVariant } from '../../shared/models/breadcrumbs-variant.model';
import { Log } from '../../shared/models/log.model';

export class Product {
  @prop()
  _id: number;

  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop({ default: true })
  isEnabled: boolean;

  @prop({ required: true, _id: false })
  name: MultilingualText;

  @arrayProp({ items: ProductCategory, _id: false })
  categories: ProductCategory[];

  @arrayProp({ items: BreadcrumbsVariant, _id: false })
  breadcrumbsVariants: BreadcrumbsVariant[];

  @arrayProp({ items: ProductSelectedAttribute, _id: false })
  attributes: ProductSelectedAttribute[];

  @arrayProp({ items: ProductVariant, _id: true })
  variants: ProductVariant[];

  @prop()
  isSeparateListItems: boolean;

  @prop()
  hasAggregatorPage: boolean;

  @prop({ default: 0 })
  allReviewsCount: number;

  @prop({ default: 0 })
  textReviewsCount: number;

  @prop({ min: 1, max: 5, default: null })
  reviewsAvgRating: number;

  @prop({ default: 0 })
  viewsCount: number;

  @arrayProp({ items: Number, default: [] })
  additionalServiceIds: number[];

  @prop({ default: '' })
  note: string;

  @arrayProp({ items: Log, default: [] })
  logs: Log[];

  @prop()
  supplierId: number;

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
