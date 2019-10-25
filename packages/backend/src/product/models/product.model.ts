import { arrayProp, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { MetaTags } from '../../shared/models/meta-tags.model';
import { Types } from 'mongoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';


export interface Product extends Base { }
export interface Product extends TimeStamps { }

export class Product {

  @prop({ required: true })
  name: string;

  @prop({ required: true, index: true })
  slug: string;

  @prop({ required: true })
  sku: string;

  @prop({ default: true })
  isEnabled: boolean;

  @arrayProp({ items: Types.ObjectId })
  categoryIds: Types.ObjectId[];

  @prop({ default: 0 })
  price: number;

  @prop()
  meta?: MetaTags;

  @prop()
  fullDescription?: string;

  @prop()
  shortDescription?: string;

  @arrayProp({ items: String, default: [] })
  mediaUrls?: string[];

  static collectionName: string = 'product';
  static model = getModelForClass(Product);
}
