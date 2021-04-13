import { elasticBooleanType, elasticTextType } from '../constants';
import { ShipmentAddressDto } from '../dtos/shared-dtos/shipment-address.dto';

export class ElasticShipmentAddress implements Record<keyof ShipmentAddressDto, any> {
  _id = elasticTextType;
  id = elasticTextType;
  type = elasticTextType;
  settlementId = elasticTextType;
  settlementName = elasticTextType;
  settlementNameFull = elasticTextType;
  addressId = elasticTextType;
  addressName = elasticTextType;
  addressNameFull = elasticTextType;
  buildingNumber = elasticTextType;
  flat = elasticTextType;
  isDefault = elasticBooleanType;
}
