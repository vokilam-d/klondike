import { arrayProp, prop } from '@typegoose/typegoose';
import { Media } from '../../shared/models/media.model';
import { MetaTags } from '../../shared/models/meta-tags.model';
import { ProductSelectedAttribute } from './product-selected-attribute.model';
import { Types } from 'mongoose';

export class ProductVariant {
  @prop({ index: true })
  _id: Types.ObjectId;

  get id() { return this._id; }
  set id(id) { this._id = id || new Types.ObjectId(); }

  @prop({ required: true })
  name: string;

  @prop({ required: true, index: true, unique: true })
  sku: string;

  @prop({ required: true, index: true, unique: true })
  slug: string;

  @arrayProp({ items: ProductSelectedAttribute, _id: false })
  attributes: ProductSelectedAttribute[];

  @prop({ default: true })
  isEnabled: boolean;

  @prop({ default: 0 })
  price: number;

  @arrayProp({ items: Media, default: [] })
  medias: Media[];

  @prop()
  fullDescription: string;

  @prop()
  shortDescription: string;

  @prop()
  metaTags: MetaTags;

  @prop({ default: true })
  isDiscountApplicable: boolean;

  @prop({ default: 0 })
  salesCount: number;
}
