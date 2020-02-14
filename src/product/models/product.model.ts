import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { Category } from '../../category/models/category.model';
import { ProductVariant } from './product-variant.model';
import { ProductSelectedAttribute } from './product-selected-attribute.model';

export class Product {
  @prop()
  _id: number;

  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop({ default: true })
  isEnabled: boolean;

  @prop({ required: true })
  name: string;

  /**
   * @type Category.id
   */
  @arrayProp({ items: Number })
  categoryIds: number[];

  @arrayProp({ items: ProductSelectedAttribute, _id: false })
  attributes: ProductSelectedAttribute[];

  @arrayProp({ items: ProductVariant, _id: true })
  variants: ProductVariant[];

  @prop({ default: 0, index: true })
  sortOrder: number;

  @prop({ default: 0 })
  reviewsCount: number;

  @prop({ min: 1, max: 5, default: null })
  reviewsAvgRating: number;

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

ProductModel.schema.index(
  { 'variants.name': 'text', 'variants.fullDescription': 'text' },
  { weights: { 'variants.name': 10, 'variants.fullDescription': 1 } }
);
