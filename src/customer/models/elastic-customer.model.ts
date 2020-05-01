import { AdminCustomerDto } from '../../shared/dtos/admin/customer.dto';
import { ElasticShippingAddressModel } from '../../shared/models/elastic-shipping-address.model';
import { elasticBooleanType, elasticDateType, elasticFloatType, elasticIntegerType, elasticTextType } from '../../shared/constants';

export class ElasticCustomerModel implements Record<keyof AdminCustomerDto, any> {
  addresses = {
    properties: new ElasticShippingAddressModel()
  };
  createdAt = elasticDateType;
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
  phoneNumber = elasticTextType;
  reviewIds = elasticIntegerType;
  totalOrdersCost = elasticFloatType;
  wishlistProductIds = elasticIntegerType;
  isRegisteredByThirdParty = elasticBooleanType;
}
