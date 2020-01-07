import { Exclude, Expose } from 'class-transformer';
import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';

export class CustomerAddress {
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
}

export class Customer {
  @Exclude()
  @prop()
  _id: number;

  @Exclude()
  __v: any;

  @Expose()
  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop({ default: '' })
  firstName: string;

  @prop({ default: '' })
  lastName: string;

  @prop({ default: '' })
  email: string;

  @prop({ default: '' })
  phoneNumber: string;

  @prop({ default: null })
  password: any;

  @prop({ default: new Date() })
  creationDate: Date;

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

  @arrayProp({ items: CustomerAddress })
  addresses: CustomerAddress[];

  @arrayProp({ items: Number, default: [] })
  reviewIds: number[];

  @arrayProp({ items: Number, default: [] })
  orderIds: number[];

  @arrayProp({ items: Number, default: [] })
  wishlistProductIds: number[];


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
