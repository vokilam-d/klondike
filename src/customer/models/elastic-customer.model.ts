import { AdminCustomerDto } from '../../shared/dtos/admin/customer.dto';
import { elasticBooleanType, elasticDateType, elasticFloatType, elasticIntegerType, elasticTextType } from '../../shared/constants';
import { ElasticShipmentAddressModel } from '../../shared/models/elastic-shipment-address.model';

export class ElasticCustomerModel implements Record<keyof AdminCustomerDto, any> {
  addresses = {
    properties: new ElasticShipmentAddressModel()
  };
  createdAt = elasticDateType;
  deprecatedAddresses = elasticTextType;
  discountPercent = elasticTextType;
  email = elasticTextType;
  firstName = elasticTextType;
  id = elasticIntegerType;
  isEmailConfirmed = elasticBooleanType;
  isLocked = elasticBooleanType;
  isPhoneNumberConfirmed = elasticBooleanType;
  lastLoggedIn = elasticDateType;
  lastName = elasticTextType;
  note = elasticTextType;
  orderIds = elasticIntegerType;
  password = elasticTextType;
  deprecatedPasswordHash = elasticTextType;
  phoneNumber = elasticTextType;
  reviewIds = elasticIntegerType;
  totalOrdersCost = elasticFloatType;
  wishlistProductIds = elasticIntegerType;
  isRegisteredByThirdParty = elasticBooleanType;
  oauthId = elasticTextType;
}
