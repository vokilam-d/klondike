import { AdminOrderDto } from '../../shared/dtos/admin/order.dto';
import { ElasticShippingAddress } from '../../shared/models/elastic-shipping-address.model';
import { elasticAutocompleteType, elasticDateType, elasticTextType } from '../../shared/constants';
import { AdminOrderItemDto } from '../../shared/dtos/admin/order-item.dto';

class ElasticOrderItem implements Record<keyof AdminOrderItemDto, any>{
  cost = elasticTextType;
  discountValue = elasticTextType;
  imageUrl = elasticTextType;
  name = elasticTextType;
  originalPrice = elasticTextType;
  price = elasticTextType;
  productId = elasticTextType;
  qty = elasticTextType;
  sku = elasticTextType;
  slug = elasticTextType;
  totalCost = elasticTextType;
  variantId = elasticTextType;
}

export class ElasticOrder implements Record<keyof AdminOrderDto, any>{
  address = {
    properties: new ElasticShippingAddress()
  };
  adminNote = elasticTextType;
  clientNote = elasticTextType;
  createdAt = elasticDateType;
  customerEmail = elasticTextType;
  customerFirstName = elasticTextType;
  customerId = elasticTextType;
  customerLastName = elasticTextType;
  customerPhoneNumber = elasticTextType;
  discountLabel = elasticTextType;
  discountPercent = elasticTextType;
  discountValue = elasticTextType;
  id = elasticTextType;
  idForCustomer = elasticTextType;
  isCallbackNeeded = elasticTextType;
  isConfirmationEmailSent = elasticTextType;
  items = {
    properties: new ElasticOrderItem()
  };
  logs = elasticTextType;
  novaposhtaTrackingId = elasticTextType;
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
