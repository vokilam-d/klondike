import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { OrderItem } from '../../order/models/order-item.model';
import { ShipmentAddress } from '../../shared/models/shipment-address.model';
import { CustomerContactInfo } from '../../order/models/customer-contact-info.model';

export class Customer {
  @prop()
  _id: number;

  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop()
  contactInfo: CustomerContactInfo;

  @prop({ default: null })
  password: string;

  @prop({ default: null })
  deprecatedPasswordHash: string;

  @prop()
  createdAt: Date;

  @prop()
  updatedAt: Date;

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

  @arrayProp({ items: String, default: [] })
  deprecatedAddresses: string[];

  @arrayProp({ items: Number, default: [] })
  storeReviewIds: number[];

  @arrayProp({ items: Number, default: [] })
  productReviewIds: number[];

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

  @prop({ default: null })
  oauthId: string;


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
