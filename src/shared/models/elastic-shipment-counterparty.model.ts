import { ShipmentCounterparty } from './shipment-counterparty.model';
import { ElasticContactInfo } from './elastic-contact-info.model';
import { ElasticShipmentAddress } from './elastic-shipment-address.model';

export class ElasticShipmentCounterparty implements Record<keyof ShipmentCounterparty, any> {
  contactInfo = {
    type: 'nested',
    properties: new ElasticContactInfo()
  };
  address = {
    type: 'nested',
    properties: new ElasticShipmentAddress()
  };
}
