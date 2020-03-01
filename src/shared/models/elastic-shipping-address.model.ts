import { AdminShippingAddressDto } from '../dtos/admin/customer.dto';
import { elasticAutocompleteType, elasticTextType } from '../constants';

export class ElasticShippingAddress implements Record<keyof AdminShippingAddressDto, any>{
  city = elasticAutocompleteType;
  firstName = elasticAutocompleteType;
  isDefault = elasticTextType;
  lastName = elasticAutocompleteType;
  novaposhtaOffice = elasticTextType;
  phoneNumber = elasticAutocompleteType;
  streetName = elasticTextType;
}
