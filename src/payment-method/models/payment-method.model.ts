import { Exclude, Expose } from 'class-transformer';
import { getModelForClass, prop } from '@typegoose/typegoose';

export class PaymentMethod {
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
