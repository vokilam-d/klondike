import { elasticAutocompleteType, elasticBooleanType, elasticTextType } from '../constants';
import { ShipmentAddressDto } from '../dtos/shared-dtos/shipment-address.dto';

export class ElasticShipmentAddressModel implements Record<keyof ShipmentAddressDto, any>{
  _id = elasticTextType;
  id = elasticTextType;
  addressType = elasticTextType;
  settlementId = elasticTextType;
  settlement = elasticTextType;
  addressId = elasticTextType;
  address = elasticTextType;
  phone = elasticAutocompleteType;
  firstName = elasticAutocompleteType;
  middleName = elasticAutocompleteType;
  lastName = elasticAutocompleteType;
  buildingNumber = elasticTextType;
  flat = elasticTextType;
  note = elasticTextType;
  warehouseId = elasticTextType;
  warehouse = elasticTextType;
  isDefault = elasticBooleanType;
}
