import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { BackendMetaTags } from '../../shared/models/meta-tags.model';
import { Exclude, Expose } from 'class-transformer';
import { BackendMedia } from '../../shared/models/media.model';

export class BackendProduct {
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
  metaTags: BackendMetaTags;

  @prop()
  fullDescription: string;

  @prop()
  shortDescription: string;

  @arrayProp({ items: BackendMedia, default: [] })
  medias: BackendMedia[];

  static collectionName: string = 'product';
}

export const BackendProductModel = getModelForClass(BackendProduct, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    }
  }
});
