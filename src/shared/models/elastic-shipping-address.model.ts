import { elasticAutocompleteType, elasticBooleanType, elasticTextType } from '../constants';
import { ShippingAddressDto } from '../dtos/shared-dtos/shipping-address.dto';

export class ElasticShippingAddressModel implements Record<keyof ShippingAddressDto, any>{
  city = elasticAutocompleteType;
  firstName = elasticAutocompleteType;
  isDefault = elasticBooleanType;
  lastName = elasticAutocompleteType;
  novaposhtaOffice = elasticTextType;
  phoneNumber = elasticAutocompleteType;
  streetName = elasticTextType;
  id = elasticTextType;
  _id = elasticTextType;
}
