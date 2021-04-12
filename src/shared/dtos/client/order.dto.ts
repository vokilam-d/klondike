import { Expose } from 'class-transformer';
import { Order } from '../../../order/models/order.model';
import { ClientOrderItemDto } from './order-item.dto';
import { ClientOrderPricesDto } from './order-prices.dto';
import { Language } from '../../enums/language.enum';
import { AdminOrderDto } from '../admin/order.dto';
import { AdminOrderItemDto } from '../admin/order-item.dto';
import { OrderItem } from '../../../order/models/order-item.model';
import { PaymentTypeEnum } from '../../enums/payment-type.enum';
import { CustomerContactInfoDto } from '../shared-dtos/customer-contact-info.dto';
import { ClientShipmentDto } from './shipment.dto';

export class ClientOrderDto implements
  Pick<Order, 'createdAt' | 'isCallbackNeeded'>,
  Record<keyof Pick<Order, 'items'>, ClientOrderItemDto[]>,
  Record<keyof Pick<Order, 'prices'>, ClientOrderPricesDto>,
  Record<keyof Pick<Order, 'shipment'>, ClientShipmentDto>
{
  @Expose()
  id: string;

  @Expose()
  paymentMethodName: string;

  @Expose()
  contactInfo: CustomerContactInfoDto;

  @Expose()
  shipment: ClientShipmentDto;

  @Expose()
  status: string;

  @Expose()
  prices: ClientOrderPricesDto;

  @Expose()
  createdAt: Date;

  @Expose()
  isOnlinePayment: boolean;

  @Expose()
  isCallbackNeeded: boolean;

  @Expose()
  items: ClientOrderItemDto[];

  @Expose()
  note: string;

  static transformToDto(order: Order | AdminOrderDto, lang: Language): ClientOrderDto {
    const orderItems = order.items as (OrderItem | AdminOrderItemDto)[];
    return {
      contactInfo: order.customerContactInfo,
      note: order.notes.client,
      createdAt: order.createdAt,
      id: order.idForCustomer,
      isCallbackNeeded: order.isCallbackNeeded,
      isOnlinePayment: order.paymentType === PaymentTypeEnum.ONLINE_PAYMENT,
      items: orderItems.map(item => ClientOrderItemDto.transformToDto(item, lang)),
      paymentMethodName: order.paymentMethodClientName[lang],
      prices: ClientOrderPricesDto.transformToDto(order.prices, lang),
      shipment: ClientShipmentDto.transformToDto(order.shipment, lang),
      status: order.statusDescription[lang]
    };
  }
}
