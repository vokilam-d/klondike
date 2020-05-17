import { getModelForClass, prop } from '@typegoose/typegoose';
import { Types } from "mongoose";
import { ShipmentStatusEnum } from '../../shared/enums/shipment-status.enum';
import { Order } from '../../order/models/order.model';

export class ShipmentSender {

  @prop()
  _id: number;

  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop()
  senderId?: string;

  @prop()
  cityId?: string;

  @prop()
  contactId?: string;

  @prop()
  addressId?: string;

  @prop()
  counterpartyRef?: string;

  @prop()
  phone?: string;

  @prop()
  name?: string;

  @prop()
  address?: string;

  @prop()
  isDefault?: boolean;

  @prop()
  apiKey?: string;

  static collectionName: string = 'shipment-sender';
}

export const ShipmentSenderModel = getModelForClass(ShipmentSender, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});

