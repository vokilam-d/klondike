import { Types } from 'mongoose';
import { prop } from '@typegoose/typegoose';

export class ShipmentAddress {

  _id?: Types.ObjectId;

  @prop()
  addressType?: string;

  @prop()
  settlementId?: string;

  @prop()
  settlement?: string;

  @prop()
  addressId?: string;

  @prop()
  address?: string;

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