import { prop } from '@typegoose/typegoose';
import { Types } from "mongoose";
import { ShipmentStatusEnum } from '../../shared/enums/shipment-status.enum';

export class Shipment {

  _id?: Types.ObjectId;

  @prop()
  trackingNumber: string;

  @prop()
  status?: ShipmentStatusEnum;

  @prop()
  statusDescription?: string;

  @prop()
  senderPhone: string;

}
