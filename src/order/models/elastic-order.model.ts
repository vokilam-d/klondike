import { AdminOrderDto } from '../../shared/dtos/admin/order.dto';
import { ElasticShippingAddressModel } from '../../shared/models/elastic-shipping-address.model';
import {
  elasticAutocompleteType,
  elasticBooleanType,
  elasticDateType,
  elasticFloatType,
  elasticIntegerType,
  elasticTextType
} from '../../shared/constants';
import { OrderItemDto } from '../../shared/dtos/shared-dtos/order-item.dto';
import { ShipmentDto } from '../../shared/dtos/admin/shipment.dto';

class ElasticOrderItemModel implements Omit<Record<keyof OrderItemDto, any>, 'crossSellProducts'> {
  cost = elasticFloatType;
  discountValue = elasticFloatType;
  imageUrl = elasticTextType;
  name = elasticTextType;
  originalPrice = elasticFloatType;
  price = elasticFloatType;
  productId = elasticIntegerType;
  qty = elasticIntegerType;
  sku = elasticTextType;
  slug = elasticTextType;
  totalCost = elasticIntegerType;
  variantId = elasticTextType;
}

class ShipmentElasticOrderModel implements Record<keyof ShipmentDto, any>{
  trackingNumber = elasticTextType;
  status = elasticTextType;
  statusDescription = elasticTextType;
  senderPhone = elasticTextType;
}

export class ElasticOrderModel implements Record<keyof AdminOrderDto, any>{
  address = {
    properties: new ElasticShippingAddressModel()
  };
  adminNote = elasticTextType;
  clientNote = elasticTextType;
  createdAt = elasticDateType;
  customerEmail = elasticTextType;
  customerFirstName = elasticTextType;
  customerId = elasticIntegerType;
  customerLastName = elasticTextType;
  customerPhoneNumber = elasticTextType;
  discountLabel = elasticTextType;
  discountPercent = elasticFloatType;
  discountValue = elasticFloatType;
  id = elasticIntegerType;
  idForCustomer = elasticTextType;
  isCallbackNeeded = elasticBooleanType;
  isConfirmationEmailSent = elasticBooleanType;
  items = {
    properties: new ElasticOrderItemModel()
  };
  logs = elasticTextType;
  shipment = new ShipmentElasticOrderModel();
  paymentMethodAdminName = elasticTextType;
  paymentMethodClientName = elasticTextType;
  paymentMethodId = elasticTextType;
  shippingMethodAdminName = elasticTextType;
  shippingMethodClientName = elasticTextType;
  shippingMethodId = elasticTextType;
  shouldSaveAddress = elasticTextType;
  state = elasticTextType;
  status = elasticTextType;
  totalCost = elasticAutocompleteType;
  totalItemsCost = elasticAutocompleteType;
}
