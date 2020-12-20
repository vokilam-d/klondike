import { getModelForClass, prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { MultilingualText } from '../../shared/models/multilingual-text.model';

export class ShippingMethod {
  _id: Types.ObjectId;

  @prop({ default: true })
  isEnabled: boolean;

  @prop()
  adminName: MultilingualText;

  @prop()
  clientName: MultilingualText;

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
