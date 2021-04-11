import { ContactInfo } from './contact-info.model';
import { ShipmentAddress } from './shipment-address.model';
import { prop } from '@typegoose/typegoose';

export class ShipmentCounterparty {
  @prop()
  contactInfo: ContactInfo;

  @prop()
  address: ShipmentAddress;
}
