import { prop } from '@typegoose/typegoose';
import { ShipmentStatusEnum } from '../../shared/enums/shipment-status.enum';
import { ShipmentPaymentMethodEnum } from '../../shared/enums/shipment-payment-method.enum';
import { ShipmentPayerEnum } from '../../shared/enums/shipment-payer.enum';
import { ShipmentAddress } from '../../shared/models/shipment-address.model';

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
  sender?: ShipmentAddress = new ShipmentAddress();

  @prop()
  recipient?: ShipmentAddress = new ShipmentAddress();

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
