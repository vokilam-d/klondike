import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { MetaTags } from '../../shared/models/meta-tags.model';
import { Exclude, Expose } from 'class-transformer';
import { Media } from '../../shared/models/media.model';

export class Product {
  @Exclude()
  @prop()
  _id: number;

  @Exclude()
  __v: any;

  @Expose()
  get id(): number { return this._id; }
  set id(id: number) { this._id = id; }

  @prop({ required: true })
  name: string;

  @prop({ required: true, index: true })
  slug: string;

  @prop({ required: true })
  sku: string;

  @prop({ default: true })
  isEnabled: boolean;

  @arrayProp({ items: Number })
  categoryIds: number[];

  @prop({ default: 0 })
  price: number;

  @prop()
  metaTags: MetaTags;

  @prop()
  fullDescription: string;

  @prop()
  shortDescription: string;

  @arrayProp({ items: Media, default: [] })
  medias: Media[];

  static collectionName: string = 'product';
}

export const ProductModel = getModelForClass(Product, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    }
  }
});
