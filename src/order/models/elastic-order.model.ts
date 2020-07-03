import { AdminOrderDto } from '../../shared/dtos/admin/order.dto';
import { ElasticShipmentAddressModel } from '../../shared/models/elastic-shipment-address.model';
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
import { ElasticLog } from '../../shared/models/elastic-log.model';

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

class ElasticShipmentModel implements Record<keyof Pick<ShipmentDto, 'trackingNumber' | 'status' | 'statusDescription' | 'recipient'>, any>{
  trackingNumber = elasticTextType;
  status = elasticTextType;
  statusDescription = elasticTextType;
  recipient = {
    type: 'nested',
    properties: new ElasticShipmentAddressModel()
  };
}

export class ElasticOrderModel implements Record<keyof AdminOrderDto, any>{
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
    type: 'nested',
    properties: new ElasticOrderItemModel()
  };
  logs = {
    type: 'nested',
    properties: new ElasticLog()
  };
  shipment = {
    type: 'nested',
    properties: new ElasticShipmentModel()
  };
  paymentMethodAdminName = elasticTextType;
  paymentMethodClientName = elasticTextType;
  paymentMethodId = elasticTextType;
  paymentType = elasticTextType;
  shippingMethodName = elasticTextType;
  shouldSaveAddress = elasticTextType;
  state = elasticTextType;
  status = elasticTextType;
  statusDescription = elasticTextType;
  totalCost = elasticAutocompleteType;
  totalItemsCost = elasticAutocompleteType;
  isOrderPaid = elasticBooleanType;
}
