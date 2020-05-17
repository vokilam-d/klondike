import { prop } from '@typegoose/typegoose';
import { ShipmentStatusEnum } from '../../shared/enums/shipment-status.enum';
import { ShipmentParticipant } from './shipment-participant.model';
import { ShipmentTypeEnum } from '../../shared/enums/shipment-type.enum';
import { ShipmentPaymentMethodEnum } from '../../shared/enums/shipment-payment-method.enum';
import { ShipmentPayerEnum } from '../../shared/enums/shipment-payer.enum';

export class Shipment {

  @prop()
  trackingNumber?: string;

  @prop()
  estimatedDeliveryDate?: string;

  @prop()
  status?: ShipmentStatusEnum;

  @prop()
  statusDescription?: string;

  @prop()
  sender?: ShipmentParticipant = {};

  @prop()
  recipient?: ShipmentParticipant = {};

  @prop()
  shipmentType?: ShipmentTypeEnum;

  @prop()
  payerType?: ShipmentPayerEnum;

  @prop()
  paymentMethod?: ShipmentPaymentMethodEnum;

  @prop()
  date?: string;

  @prop()
  weight?: string;

  @prop()
  length?: string;

  @prop()
  width?: string;

  @prop()
  height?: string;

  @prop()
  backwardMoneyDelivery?: string;

  @prop()
  description?: string;

}
