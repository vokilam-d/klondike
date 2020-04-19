import { getModelForClass, prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { PaymentTypeEnum } from '../../shared/enums/payment-type.enum';

export class PaymentMethod {
  _id: Types.ObjectId;

  @prop({ default: true })
  isEnabled: boolean;

  @prop()
  paymentType: PaymentTypeEnum;

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
