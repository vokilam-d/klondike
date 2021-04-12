import { ContactInfo } from './contact-info.model';
import { elasticAutocompleteTextType } from '../constants';

export class ElasticContactInfo implements Record<keyof ContactInfo, any> {
  firstName = elasticAutocompleteTextType;
  lastName = elasticAutocompleteTextType;
  middleName = elasticAutocompleteTextType;
  phoneNumber = elasticAutocompleteTextType;
}
