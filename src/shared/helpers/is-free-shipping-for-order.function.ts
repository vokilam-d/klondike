import { Order } from '../../order/models/order.model';
import { priceThresholdForFreeShipping } from '../constants';
import { AddressTypeEnum } from '../enums/address-type.enum';

export const isFreeShippingForOrder = (order: Order) => {
  return order.prices.totalCost >= priceThresholdForFreeShipping && order.shipment.recipient.addressType === AddressTypeEnum.WAREHOUSE;
}
