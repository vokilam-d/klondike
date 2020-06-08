import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { OrderItem } from '../../order/models/order-item.model';
import { ShipmentAddress } from '../../shared/models/shipment-address.model';

export class Customer {
  @prop()
  _id: number;

  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop({ default: '' })
  firstName: string;

  @prop({ default: '' })
  lastName: string;

  @prop({ index: true, unique: true, default: '' })
  email: string;

  @prop({ index: true, default: '' })
  phoneNumber: string;

  @prop({ default: null })
  password: string;

  @prop({ default: new Date() })
  createdAt: Date;

  @prop({ default: null })
  lastLoggedIn: Date;

  @prop({ default: false })
  isLocked: boolean;

  @prop({ default: false })
  isEmailConfirmed: boolean;

  @prop({ default: false })
  isPhoneNumberConfirmed: boolean;

  @prop({ default: '' })
  note: string;

  @arrayProp({ items: ShipmentAddress, default: [] })
  addresses: ShipmentAddress[];

  @arrayProp({ items: Number, default: [] })
  reviewIds: number[];

  @arrayProp({ items: Number, default: [] })
  orderIds: number[];

  @arrayProp({ items: Number, default: [] })
  wishlistProductIds: number[];

  @prop({ default: 0 })
  discountPercent: number;

  @prop({ default: 0 })
  totalOrdersCount: number;

  @prop({ default: 0 })
  totalOrdersCost: number;

  @prop({ default: [] })
  cart: OrderItem[];

  @prop({ default: false })
  isRegisteredByThirdParty: boolean;


  static collectionName: string = 'customer';
}

export const CustomerModel = getModelForClass(Customer, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
