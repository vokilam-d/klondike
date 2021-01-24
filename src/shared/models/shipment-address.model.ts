import { Types } from 'mongoose';
import { prop } from '@typegoose/typegoose';
import { AddressTypeEnum } from '../enums/address-type.enum';

export class ShipmentAddress {

  _id?: Types.ObjectId;

  @prop({ enum: AddressTypeEnum })
  addressType?: AddressTypeEnum;

  @prop()
  settlementId?: string;

  @prop()
  settlement?: string;

  @prop()
  settlementFull?: string;

  @prop()
  addressId?: string;

  @prop()
  address?: string;

  @prop()
  addressFull?: string;

  @prop()
  phone?: string;

  @prop()
  firstName?: string;

  @prop()
  lastName?: string;

  @prop()
  middleName?: string;

  @prop()
  buildingNumber?: string;

  @prop()
  flat?: string;

  @prop()
  note?: string;

  @prop()
  isDefault?: boolean;

}
