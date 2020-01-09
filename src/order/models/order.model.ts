import { Exclude, Expose } from 'class-transformer';
import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { ShippingAddress } from '../../customer/models/customer.model';


export class OrderItem {
  @prop()
  name: string;

  @prop()
  originalPrice: number;

  @prop()
  price: number;

  @prop()
  qty: number;

  @prop()
  cost: number;

  @prop()
  discountAmountInPercent: number;

  @prop()
  totalPrice: number;
}

export class Order {
  @Exclude()
  @prop()
  _id: number;

  @Exclude()
  __v: any;

  @Expose()
  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop()
  customerId: number;

  @prop()
  address: ShippingAddress;

  @prop()
  dateCreated: Date;

  @prop()
  isConfirmationEmailSent: boolean;

  @prop()
  paymentMethod: any;

  @prop()
  shippingMethod: any;

  @prop()
  isCallbackNeeded: boolean;

  @prop()
  novaposhtaTrackingId: string;

  @arrayProp({ items: OrderItem })
  items: OrderItem[];

  @prop()
  status: any;

  @arrayProp({ items: String })
  notes: string[];

  @prop()
  orderTotalPrice: number;

  @arrayProp({ items: Number })
  invoiceIds: number[];

  @arrayProp({ items: Number })
  shipmentIds: number[];

  @arrayProp({ items: String })
  attributes: string[];


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
