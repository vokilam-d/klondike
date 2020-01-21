import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { ShippingAddress } from '../../customer/models/customer.model';
import { OrderItem } from './order-item.model';

export class Order {
  @prop()
  _id: number;

  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop()
  customerId: number;

  @prop()
  customerFirstName: string;

  @prop()
  customerLastName: string;

  @prop({ default: '' })
  customerEmail: string;

  @prop({ default: '' })
  customerPhoneNumber: string;

  @prop()
  address: ShippingAddress;

  @prop()
  shouldSaveAddress: boolean;

  @prop({ default: new Date() })
  createdDate: Date;

  @prop()
  isConfirmationEmailSent: boolean;

  @prop()
  paymentMethodId: string;

  @prop()
  paymentMethodName: string;

  @prop()
  shippingMethodId: string;

  @prop()
  shippingMethodName: string;

  @prop()
  isCallbackNeeded: boolean;

  @prop()
  novaposhtaTrackingId: string;

  @arrayProp({ items: OrderItem })
  items: OrderItem[];

  @prop()
  status: any;

  @prop()
  clientNote: string;

  @prop()
  adminNote: string;

  @arrayProp({ items: String })
  logs: string[];

  @prop()
  orderTotalPrice: number;


  static collectionName: string = 'order';
}

export const OrderModel = getModelForClass(Order, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
