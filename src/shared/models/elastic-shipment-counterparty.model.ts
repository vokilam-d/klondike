import { ShipmentCounterparty } from './shipment-counterparty.model';
import { ElasticContactInfo } from './elastic-contact-info.model';
import { ElasticShipmentAddress } from './elastic-shipment-address.model';
import { elasticKeywordType } from '../constants';

export class ElasticShipmentCounterparty implements Record<keyof ShipmentCounterparty, any> {
  id = elasticKeywordType;
  contactInfo = {
    type: 'nested',
    properties: new ElasticContactInfo()
  };
  address = {
    type: 'nested',
    properties: new ElasticShipmentAddress()
  };
}
