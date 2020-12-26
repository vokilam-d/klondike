import { getModelForClass, prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { PaymentTypeEnum } from '../../shared/enums/payment-type.enum';
import { MultilingualText } from '../../shared/models/multilingual-text.model';

export class PaymentMethod {
  _id: Types.ObjectId;

  @prop({ default: true })
  isEnabled: boolean;

  @prop()
  paymentType: PaymentTypeEnum;

  @prop({ _id: false })
  adminName: MultilingualText;

  @prop({ _id: false })
  clientName: MultilingualText;

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
