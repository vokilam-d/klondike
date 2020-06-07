import { getModelForClass, prop } from '@typegoose/typegoose';
import { AddressTypeEnum } from '../../shared/enums/address-type.enum';

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
  city?: string;

  @prop()
  contactId?: string;

  @prop()
  addressId?: string;

  @prop()
  address?: string;

  @prop()
  addressType?: AddressTypeEnum;

  @prop()
  counterpartyRef?: string;

  @prop()
  phone?: string;

  @prop()
  firstName?: string;

  @prop()
  lastName?: string;

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

