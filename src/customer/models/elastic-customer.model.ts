import { AdminCustomerDto } from '../../shared/dtos/admin/customer.dto';
import {
  elasticAutocompleteTextType,
  elasticBooleanType,
  elasticDateType,
  elasticFloatType,
  elasticIntegerType,
  elasticTextType
} from '../../shared/constants';
import { ElasticShipmentAddressModel } from '../../shared/models/elastic-shipment-address.model';

export class ElasticCustomerModel implements Record<keyof AdminCustomerDto, any> {
  addresses = {
    properties: new ElasticShipmentAddressModel()
  };
  createdAt = elasticDateType;
  deprecatedAddresses = elasticTextType;
  discountPercent = elasticTextType;
  email = elasticTextType;
  firstName = elasticAutocompleteTextType;
  id = elasticIntegerType;
  isEmailConfirmed = elasticBooleanType;
  isLocked = elasticBooleanType;
  isPhoneNumberConfirmed = elasticBooleanType;
  lastLoggedIn = elasticDateType;
  lastName = elasticAutocompleteTextType;
  note = elasticTextType;
  orderIds = elasticIntegerType;
  password = elasticTextType;
  deprecatedPasswordHash = elasticTextType;
  phoneNumber = elasticTextType;
  storeReviewIds = elasticIntegerType;
  productReviewIds = elasticIntegerType;
  totalOrdersCost = elasticFloatType;
  wishlistProductIds = elasticIntegerType;
  isRegisteredByThirdParty = elasticBooleanType;
  oauthId = elasticTextType;
}
