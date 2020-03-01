import { AdminCustomerDto } from '../../shared/dtos/admin/customer.dto';
import { ElasticShippingAddress } from '../../shared/models/elastic-shipping-address.model';
import { elasticDateType, elasticTextType } from '../../shared/constants';

export class ElasticCustomer implements Record<keyof AdminCustomerDto, any> {
  addresses = {
    properties: new ElasticShippingAddress()
  };
  createdAt = elasticDateType;
  discountPercent = elasticTextType;
  email = elasticTextType;
  firstName = elasticTextType;
  id = elasticTextType;
  isEmailConfirmed = elasticTextType;
  isLocked = elasticTextType;
  isPhoneNumberConfirmed = elasticTextType;
  lastLoggedIn = elasticDateType;
  lastName = elasticTextType;
  note = elasticTextType;
  orderIds = elasticTextType;
  password = elasticTextType;
  phoneNumber = elasticTextType;
  reviewIds = elasticTextType;
  totalOrdersCost = elasticTextType;
  wishlistProductIds = elasticTextType;
}
