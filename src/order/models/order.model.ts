import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { ShippingAddress } from '../../customer/models/customer.model';
import { OrderItem } from './order-item.model';
import { EOrderStatus } from '../../shared/enums/order-status.enum';

export class Order {
  @prop()
  _id: number;

  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop()
  idForCustomer: string;

  @prop({ index: true })
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
  createdAt: Date;

  @prop()
  isConfirmationEmailSent: boolean;

  @prop()
  paymentMethodId: string;

  @prop()
  paymentMethodClientName: string;

  @prop()
  paymentMethodAdminName: string;

  @prop()
  shippingMethodId: string;

  @prop()
  shippingMethodClientName: string;

  @prop()
  shippingMethodAdminName: string;

  @prop()
  isCallbackNeeded: boolean;

  @prop()
  novaposhtaTrackingId: string;

  @arrayProp({ items: OrderItem })
  items: OrderItem[];

  @prop()
  state: any;

  @prop()
  status: EOrderStatus;

  @prop()
  clientNote: string;

  @prop()
  adminNote: string;

  @arrayProp({ items: String })
  logs: string[];

  @prop({ default: 0 })
  totalItemsCost: number;

  @prop({ default: 0 })
  discountPercent: number;

  @prop({ default: 0 })
  discountValue: number;

  @prop()
  discountLabel: string;

  @prop({ default: 0 })
  totalCost: number;


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
