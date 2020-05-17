import { getModelForClass, prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { PaymentMethodEnum } from '../../shared/enums/payment-method.enum';

export class PaymentMethod {
  _id: Types.ObjectId;

  @prop({ default: true })
  isEnabled: boolean;

  @prop()
  paymentType: PaymentMethodEnum;

  @prop()
  adminName: string;

  @prop()
  clientName: string;

  @prop({ default: 0 })
  price: number;

  @prop({ default: 0 })
  sortOrder: number;


  static collectionName: string = 'payment-method';
}

export const PaymentMethodModel = getModelForClass(PaymentMethod, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
