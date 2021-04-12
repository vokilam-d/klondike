import { elasticBooleanType, elasticTextType } from '../constants';
import { ShipmentAddressDto } from '../dtos/shared-dtos/shipment-address.dto';

export class ElasticShipmentAddress implements Record<keyof ShipmentAddressDto, any> {
  _id = elasticTextType;
  id = elasticTextType;
  addressType = elasticTextType;
  settlementId = elasticTextType;
  settlement = elasticTextType;
  settlementFull = elasticTextType;
  addressId = elasticTextType;
  address = elasticTextType;
  addressFull = elasticTextType;
  buildingNumber = elasticTextType;
  flat = elasticTextType;
  isDefault = elasticBooleanType;
}
