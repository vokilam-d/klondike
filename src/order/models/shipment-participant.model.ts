import { prop } from '@typegoose/typegoose';
import { Types } from "mongoose";
import { ShipmentStatusEnum } from '../../shared/enums/shipment-status.enum';

export class ShipmentParticipant {

  @prop()
  id?: number;

  @prop()
  cityId?: string;

  @prop()
  city?: string;

  @prop()
  settlementId?: string;

  @prop()
  contactId?: string;

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

}
