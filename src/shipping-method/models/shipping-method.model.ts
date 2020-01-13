import { Exclude, Expose } from 'class-transformer';
import { getModelForClass, prop } from '@typegoose/typegoose';

export class ShippingMethod {
  @Exclude()
  _id: any;

  @Exclude()
  __v: any;

  @Expose()
  set id(id: string) { this._id = id; }
  get id(): string { return this._id; }

  @prop({ default: true })
  isEnabled: boolean;

  @prop()
  name: string;

  @prop({ default: 0 })
  price: number;

  @prop({ default: 0 })
  sortOrder: number;


  static collectionName: string = 'shipping_method';
}

export const ShippingMethodModel = getModelForClass(ShippingMethod, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
