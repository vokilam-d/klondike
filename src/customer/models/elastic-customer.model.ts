import { AdminCustomerDto } from '../../shared/dtos/admin/customer.dto';
import { elasticBooleanType, elasticDateType, elasticFloatType, elasticIntegerType, elasticTextType } from '../../shared/constants';
import { ElasticShipmentAddress } from '../../shared/models/elastic-shipment-address.model';
import { ElasticCustomerContactInfo, ElasticOrderItemModel } from '../../order/models/elastic-order.model';

export class ElasticCustomerModel implements Record<keyof AdminCustomerDto, any> {
  addresses = {
    type: 'nested',
    properties: new ElasticShipmentAddress()
  };
  createdAt = elasticDateType;
  deprecatedAddresses = elasticTextType;
  discountPercent = elasticTextType;
  id = elasticIntegerType;
  isEmailConfirmed = elasticBooleanType;
  isLocked = elasticBooleanType;
  isPhoneNumberConfirmed = elasticBooleanType;
  lastLoggedIn = elasticDateType;
  note = elasticTextType;
  orderIds = elasticIntegerType;
  password = elasticTextType;
  deprecatedPasswordHash = elasticTextType;
  storeReviewIds = elasticIntegerType;
  productReviewIds = elasticIntegerType;
  totalOrdersCost = elasticFloatType;
  wishlistProductIds = elasticIntegerType;
  isRegisteredByThirdParty = elasticBooleanType;
  oauthId = elasticTextType;
  cart = {
    type: 'nested',
    properties: new ElasticOrderItemModel()
  };
  contactInfo = {
    type: 'nested',
    properties: new ElasticCustomerContactInfo()
  };
  totalOrdersCount = elasticIntegerType;
  updatedAt = elasticDateType;
}
