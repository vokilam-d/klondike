import { AdminOrderDto } from '../../shared/dtos/admin/order.dto';
import { elasticBooleanType, elasticDateType, elasticFloatType, elasticIntegerType, elasticTextType } from '../../shared/constants';
import { BaseShipmentDto } from '../../shared/dtos/shared-dtos/base-shipment.dto';
import { ElasticLog } from '../../shared/models/elastic-log.model';
import { OrderItemAdditionalService } from './order-item-additional-service.model';
import { AdminOrderItemDto } from '../../shared/dtos/admin/order-item.dto';
import { AdminOrderPricesDto } from '../../shared/dtos/admin/order-prices.dto';
import { ElasticMultilingualText } from '../../shared/models/elastic-multilingual-text.model';
import { ManagerDto } from '../../shared/dtos/admin/manager.dto';
import { ElasticShipmentCounterparty } from '../../shared/models/elastic-shipment-counterparty.model';
import { AdminOrderNotesDto } from '../../shared/dtos/admin/order-notes.dto';
import { ElasticContactInfo } from '../../shared/models/elastic-contact-info.model';
import { CustomerContactInfoDto } from '../../shared/dtos/shared-dtos/customer-contact-info.dto';
import { AdminOrderPaymentInfoDto } from '../../shared/dtos/admin/order-payment-info.dto';

class ElasticOrderItemAdditionalService implements Record<keyof OrderItemAdditionalService, any> {
  id = elasticIntegerType;
  name = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
  price = elasticFloatType;
}

export class ElasticOrderItemModel implements Omit<Record<keyof AdminOrderItemDto, any>, 'crossSellProducts'> {
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

class ElasticShipment implements Record<keyof Pick<BaseShipmentDto, 'trackingNumber' | 'status' | 'statusDescription' | 'recipient' | 'sender'>, any>{
  trackingNumber = elasticTextType;
  status = elasticTextType;
  statusDescription = elasticTextType;
  recipient = {
    type: 'nested',
    properties: new ElasticShipmentCounterparty()
  };
  sender = {
    type: 'nested',
    properties: new ElasticShipmentCounterparty()
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

class ElasticOrderNotes implements Record<keyof AdminOrderNotesDto, any> {
  aboutCustomer = elasticTextType;
  fromAdmin = elasticTextType;
  fromCustomer = elasticTextType;
}

export class ElasticCustomerContactInfo extends ElasticContactInfo implements Record<keyof CustomerContactInfoDto, any> {
  email = elasticTextType;
}

class ElasticOrderPaymentInfo implements Record<keyof AdminOrderPaymentInfoDto, any> {
  methodAdminName = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
  methodClientName = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
  methodId = elasticTextType;
  type = elasticTextType;
}

export class ElasticOrder implements Omit<Record<keyof AdminOrderDto, any>, '_id'> {
  createdAt = elasticDateType;
  customerContactInfo = {
    type: 'nested',
    properties: new ElasticCustomerContactInfo()
  };
  customerId = elasticIntegerType;
  id = elasticIntegerType;
  idForCustomer = elasticTextType;
  isCallbackNeeded = elasticBooleanType;
  isOrderPaid = elasticBooleanType;
  items = {
    type: 'nested',
    properties: new ElasticOrderItemModel()
  };
  logs = {
    type: 'nested',
    properties: new ElasticLog()
  };
  manager = {
    type: 'nested',
    properties: new ElasticOrderManager()
  };
  medias: any;
  notes = {
    type: 'nested',
    properties: new ElasticOrderNotes()
  };
  paymentInfo = {
    type: 'nested',
    properties: new ElasticOrderPaymentInfo()
  };
  prices = {
    type: 'nested',
    properties: new ElasticOrderPrices()
  };
  shipment = {
    type: 'nested',
    properties: new ElasticShipment()
  };
  shippedAt = elasticDateType;
  source = elasticTextType;
  status = elasticTextType;
  statusDescription = elasticTextType;
  updatedAt = elasticDateType;
}
