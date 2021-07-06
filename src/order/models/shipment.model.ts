import { prop } from '@typegoose/typegoose';
import { ShipmentStatusEnum } from '../../shared/enums/shipment-status.enum';
import { ShipmentPayerEnum } from '../../shared/enums/shipment-payer.enum';
import { MultilingualText } from '../../shared/models/multilingual-text.model';
import { getTranslations } from '../../shared/helpers/translate/translate.function';
import { ShipmentCounterparty } from '../../shared/models/shipment-counterparty.model';

export class Shipment {

  @prop()
  trackingNumber: string;

  @prop()
  estimatedDeliveryDate: string;

  @prop()
  status: ShipmentStatusEnum;

  @prop()
  statusDescription: string;

  @prop({ default: new ShipmentCounterparty(), _id: false })
  sender: ShipmentCounterparty;

  @prop({ default: new ShipmentCounterparty(), _id: false })
  recipient: ShipmentCounterparty;

  get shippingMethodDescription(): MultilingualText { return getTranslations(this.recipient.address.type); }

  @prop()
  payerType: ShipmentPayerEnum;

  @prop()
  weight: string;

  @prop()
  length: string;

  @prop()
  width: string;

  @prop()
  height: string;

  @prop()
  backwardMoneyDelivery: number;

  @prop()
  cost: number;

  @prop()
  description: string;

  @prop()
  paidStorageStartDate: Date;
}
