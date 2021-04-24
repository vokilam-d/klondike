import { ContactInfo } from './contact-info.model';
import { ShipmentAddress } from './shipment-address.model';
import { prop } from '@typegoose/typegoose';

export class ShipmentCounterparty {
  @prop({ _id: false, default: new ContactInfo() })
  contactInfo: ContactInfo;

  @prop({ default: new ShipmentAddress() })
  address: ShipmentAddress;
}
