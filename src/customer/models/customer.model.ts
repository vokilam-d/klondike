import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';

export class ShippingAddress {
  @prop({ required: true })
  firstName: string;

  @prop({ default: '' })
  lastName: string;

  @prop({ default: '' })
  phoneNumber: string;

  @prop({ required: true })
  city: string;

  @prop({ default: '' })
  streetName: string;

  @prop({ default: '' })
  novaposhtaOffice: any;

  @prop({ default: false })
  isDefault: boolean;
}

export class Customer {
  @prop()
  _id: number;

  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop({ default: '' })
  firstName: string;

  @prop({ default: '' })
  lastName: string;

  @prop({ index: true, default: '' })
  email: string;

  @prop({ default: '' })
  phoneNumber: string;

  @prop({ default: null })
  password: any;

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

  @arrayProp({ items: ShippingAddress })
  addresses: ShippingAddress[];

  @arrayProp({ items: Number, default: [] })
  reviewIds: number[];

  @arrayProp({ items: Number, default: [] })
  orderIds: number[];

  @arrayProp({ items: Number, default: [] })
  wishlistProductIds: number[];

  @prop({ default: 0 })
  discountPercent: number;

  @prop({ default: 0 })
  totalOrdersCost: number;


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
