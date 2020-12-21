import { AdminOrderDto } from '../../shared/dtos/admin/order.dto';
import { ElasticShipmentAddressModel } from '../../shared/models/elastic-shipment-address.model';
import { elasticBooleanType, elasticDateType, elasticFloatType, elasticIntegerType, elasticTextType } from '../../shared/constants';
import { OrderItemDto } from '../../shared/dtos/shared-dtos/order-item.dto';
import { ShipmentDto } from '../../shared/dtos/admin/shipment.dto';
import { ElasticLog } from '../../shared/models/elastic-log.model';
import { OrderPricesDto } from '../../shared/dtos/shared-dtos/order-prices.dto';
import { OrderItemAdditionalService } from './order-item-additional-service.model';

class ElasticOrderItemAdditionalService implements Record<keyof OrderItemAdditionalService, any> {
  id = elasticIntegerType;
  name = elasticTextType;
  price = elasticFloatType;
}

class ElasticOrderItemModel implements Omit<Record<keyof OrderItemDto, any>, 'crossSellProducts'> {
  cost = elasticFloatType;
  oldCost = elasticFloatType;
  imageUrl = elasticTextType;
  name = elasticTextType;
  price = elasticFloatType;
  oldPrice = elasticFloatType;
  productId = elasticIntegerType;
  qty = elasticIntegerType;
  sku = elasticTextType;
  vendorCode = elasticTextType;
  slug = elasticTextType;
  variantId = elasticTextType;
  additionalServices = {
    type: 'nested',
    properties: new ElasticOrderItemAdditionalService()
  }
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

class ElasticOrderPrices implements Record<keyof Pick<OrderPricesDto, 'totalCost' | 'discountLabel' | 'discountPercent' | 'discountValue' | 'itemsCost'>, any> {
  discountLabel = elasticTextType;
  discountPercent = elasticIntegerType;
  discountValue = elasticIntegerType;
  itemsCost = elasticIntegerType;
  totalCost = elasticIntegerType;
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
  customerNote = elasticTextType;
  id = elasticIntegerType;
  idForCustomer = elasticTextType;
  isCallbackNeeded = elasticBooleanType;
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
  source = elasticTextType;
  prices = {
    type: 'nested',
    properties: new ElasticOrderPrices()
  }
  isOrderPaid = elasticBooleanType;
}
