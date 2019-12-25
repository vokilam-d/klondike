import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { Category } from '../../category/models/category.model';
import { ProductVariant } from './product-variant.model';
import { ProductSelectedAttribute } from './product-selected-attribute.model';
import { Exclude } from 'class-transformer';

export class Product {
  @Exclude()
  @prop()
  _id: number;

  get id(): number { return this._id; }
  set id(id: number) { this._id = id; }

  @Exclude()
  __v: any;

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

  @arrayProp({ items: ProductVariant })
  variants: ProductVariant[];

  @prop({ default: 0, index: true })
  sortOrder: number;

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
