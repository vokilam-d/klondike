import { Types } from 'mongoose';
import { prop } from '@typegoose/typegoose';
import { AddressTypeEnum } from '../enums/address-type.enum';

export class ShipmentAddress {

  _id?: Types.ObjectId;

  @prop({ enum: AddressTypeEnum })
  type?: AddressTypeEnum;

  @prop()
  settlementId?: string;

  @prop()
  settlementName?: string;

  @prop()
  settlementNameFull?: string;

  @prop()
  addressId?: string;

  @prop()
  addressName?: string;

  @prop()
  addressNameFull?: string;

  @prop()
  buildingNumber?: string;

  @prop()
  flat?: string;

  @prop()
  isDefault?: boolean;

}
