import { Order } from '../../../order/models/order.model';
import { ManagerDto } from './manager.dto';
import { CustomerContactInfoDto } from '../shared-dtos/customer-contact-info.dto';
import { AdminOrderItemDto } from './order-item.dto';
import { AdminLogDto } from './log.dto';
import { AdminMediaDto } from './media.dto';
import { AdminOrderPricesDto } from './order-prices.dto';
import { AdminShipmentDto } from './shipment.dto';
import { OrderStatusEnum } from '../../enums/order-status.enum';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';
import { Exclude, Expose, Type } from 'class-transformer';
import { AdminOrderNotesDto } from './order-notes.dto';
import { AdminOrderPaymentInfoDto } from './order-payment-info.dto';

export class AdminOrderDto implements Order {
  @Exclude()
  _id: number;

  @Expose()
  id: number;

  @Expose()
  idForCustomer: string;

  @Expose()
  customerContactInfo: CustomerContactInfoDto;

  @Expose()
  customerId: number;

  @Expose()
  isCallbackNeeded: boolean;

  @Expose()
  isOrderPaid: boolean;

  @Expose()
  @Type(() => AdminOrderItemDto)
  items: AdminOrderItemDto[];

  @Expose()
  @Type(() => AdminLogDto)
  logs: AdminLogDto[];

  @Expose()
  @Type(() => ManagerDto)
  manager: ManagerDto;

  @Expose()
  @Type(() => AdminMediaDto)
  medias: AdminMediaDto[];

  @Expose()
  @Type(() => AdminOrderNotesDto)
  notes: AdminOrderNotesDto;

  @Expose()
  @Type(() => AdminOrderPaymentInfoDto)
  paymentInfo: AdminOrderPaymentInfoDto;

  @Expose()
  @Type(() => AdminOrderPricesDto)
  prices: AdminOrderPricesDto;

  @Expose()
  @Type(() => AdminShipmentDto)
  shipment: AdminShipmentDto;

  @Expose()
  source: 'client' | 'manager';

  @Expose()
  status: OrderStatusEnum;

  @Expose()
  @Type(() => MultilingualTextDto)
  statusDescription: MultilingualTextDto;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  shippedAt: Date;
}
