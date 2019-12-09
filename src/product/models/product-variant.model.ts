import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { Exclude, Expose } from 'class-transformer';
import { Media } from '../../shared/models/media.model';

export class ProductVariant {
  @Exclude()
  @prop()
  _id: number; // SKU

  @Exclude()
  __v: any;

  @Expose()
  get id(): number { return this._id; }
  set id(id: number) { this._id = id; }

  @prop({ required: true })
  name: string;

  @prop({ required: true })
  productId: number;

  @prop({ default: true })
  isEnabled: boolean;

  @prop({ default: 0 })
  price: number;

  @arrayProp({ items: Media, default: [] })
  medias: Media[];

  @prop()
  fullDescription?: string;

  static collectionName: string = 'product-variant';
}

export const ProductVariantModel = getModelForClass(ProductVariant, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    }
  }
});
