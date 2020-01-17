import { getModelForClass, prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

export class ShippingMethod {
  _id: Types.ObjectId;

  @prop({ default: true })
  isEnabled: boolean;

  @prop()
  name: string;

  @prop({ default: 0 })
  price: number;

  @prop({ default: 0 })
  sortOrder: number;


  static collectionName: string = 'shipping-method';
}

export const ShippingMethodModel = getModelForClass(ShippingMethod, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
