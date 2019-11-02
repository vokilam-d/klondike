import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { BackendMetaTags } from '../../shared/models/meta-tags.model';
import { Types } from 'mongoose';

export class BackendProduct {

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
  meta?: BackendMetaTags;

  @prop()
  fullDescription?: string;

  @prop()
  shortDescription?: string;

  @arrayProp({ items: String, default: [] })
  mediaUrls?: string[];

  static collectionName: string = 'product';
}

export const BackendProductModel = getModelForClass(BackendProduct);
