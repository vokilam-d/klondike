import { arrayProp, prop } from '@typegoose/typegoose';
import { Media } from '../../shared/models/media.model';
import { MetaTags } from '../../shared/models/meta-tags.model';
import { ProductSelectedAttribute } from './product-selected-attribute.model';
import { Types } from 'mongoose';
import { ECurrencyCode } from '../../shared/enums/currency.enum';

export class ProductVariant {
  @prop({ index: true })
  _id: Types.ObjectId;

  get id() { return this._id; }
  set id(id) { this._id = id || new Types.ObjectId(); }

  @prop({ required: true })
  name: string;

  @prop({ required: true, index: true, unique: true })
  sku: string;

  @prop({ index: true })
  vendorCode: string;

  @prop({ index: true })
  gtin: string;

  @prop({ required: true, index: true, unique: true })
  slug: string;

  @arrayProp({ items: ProductSelectedAttribute, _id: false })
  attributes: ProductSelectedAttribute[];

  @prop({ default: true })
  isEnabled: boolean;

  @prop({ default: 0 })
  price: number;

  @prop({ default: null })
  oldPrice: number;

  @prop({ default: ECurrencyCode.UAH })
  currency: ECurrencyCode;

  @prop({ default: 0 })
  priceInDefaultCurrency: number;

  @prop({ default: null })
  oldPriceInDefaultCurrency: number;

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

  @prop()
  googleAdsProductTitle: string;
}
