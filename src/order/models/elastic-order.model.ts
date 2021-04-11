import { AdminOrderDto } from '../../shared/dtos/admin/order.dto';
import { ElasticShipmentAddressModel } from '../../shared/models/elastic-shipment-address.model';
import { elasticBooleanType, elasticDateType, elasticFloatType, elasticIntegerType, elasticTextType } from '../../shared/constants';
import { BaseShipmentDto } from '../../shared/dtos/shared-dtos/base-shipment.dto';
import { ElasticLog } from '../../shared/models/elastic-log.model';
import { OrderItemAdditionalService } from './order-item-additional-service.model';
import { AdminOrderItemDto } from '../../shared/dtos/admin/order-item.dto';
import { AdminOrderPricesDto } from '../../shared/dtos/admin/order-prices.dto';
import { ElasticMultilingualText } from '../../shared/models/elastic-multilingual-text.model';
import { ManagerDto } from '../../shared/dtos/admin/manager.dto';

class ElasticOrderItemAdditionalService implements Record<keyof OrderItemAdditionalService, any> {
  id = elasticIntegerType;
  name = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
  price = elasticFloatType;
}

class ElasticOrderItemModel implements Omit<Record<keyof AdminOrderItemDto, any>, 'crossSellProducts'> {
  cost = elasticFloatType;
  oldCost = elasticFloatType;
  imageUrl = elasticTextType;
  name = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
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
  isPacked = elasticBooleanType;
}

class ElasticShipmentModel implements Record<keyof Pick<BaseShipmentDto, 'trackingNumber' | 'status' | 'statusDescription' | 'recipient'>, any>{
  trackingNumber = elasticTextType;
  status = elasticTextType;
  statusDescription = elasticTextType;
  recipient = {
    type: 'nested',
    properties: new ElasticShipmentAddressModel()
  };
}

class ElasticOrderPrices implements Record<keyof Pick<AdminOrderPricesDto, 'totalCost' | 'discountValue' | 'itemsCost'>, any> {
  discountValue = elasticIntegerType;
  itemsCost = elasticIntegerType;
  totalCost = elasticIntegerType;
}

class ElasticOrderManager implements Record<keyof Pick<ManagerDto, 'userId' | 'name'>, any> {
  userId = elasticTextType;
  name = elasticTextType;
}

export class ElasticOrderModel implements Record<keyof AdminOrderDto, any>{
  adminNote = elasticTextType;
  clientNote = elasticTextType;
  createdAt = elasticDateType;
  shippedAt = elasticDateType;
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
  paymentMethodAdminName = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
  paymentMethodClientName = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
  paymentMethodId = elasticTextType;
  paymentType = elasticTextType;
  shippingMethodName = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
  shouldSaveAddress = elasticTextType;
  state = elasticTextType;
  status = elasticTextType;
  statusDescription = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
  source = elasticTextType;
  prices = {
    type: 'nested',
    properties: new ElasticOrderPrices()
  };
  manager = {
    type: 'nested',
    properties: new ElasticOrderManager()
  };
  isOrderPaid = elasticBooleanType;
  medias: any;
}
