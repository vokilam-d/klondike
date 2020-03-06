import { AdminShippingAddressDto } from '../dtos/admin/customer.dto';
import { elasticAutocompleteType, elasticBooleanType, elasticTextType } from '../constants';

export class ElasticShippingAddressModel implements Record<keyof AdminShippingAddressDto, any>{
  city = elasticAutocompleteType;
  firstName = elasticAutocompleteType;
  isDefault = elasticBooleanType;
  lastName = elasticAutocompleteType;
  novaposhtaOffice = elasticTextType;
  phoneNumber = elasticAutocompleteType;
  streetName = elasticTextType;
}
