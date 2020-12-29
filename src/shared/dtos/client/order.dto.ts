import { ArrayMinSize, IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { Order } from '../../../order/models/order.model';
import { ShipmentDto } from '../admin/shipment.dto';
import { ShipmentAddressDto } from '../shared-dtos/shipment-address.dto';
import { TrimString } from '../../decorators/trim-string.decorator';
import { ClientOrderItemDto } from './order-item.dto';
import { ClientOrderPricesDto } from './order-prices.dto';
import { Language } from '../../enums/language.enum';
import { AdminOrderDto } from '../admin/order.dto';
import { AdminOrderItemDto } from '../admin/order-item.dto';
import { OrderItem } from '../../../order/models/order-item.model';
import { PaymentTypeEnum } from '../../enums/payment-type.enum';

export class ClientAddOrderDto implements
  Pick<Order, 'paymentMethodId' | 'isCallbackNeeded' | 'clientNote'>,
  Record<keyof Pick<Order, 'items'>, ClientOrderItemDto[]>
{
  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  email: string;

  @Expose()
  @ValidateNested()
  @Type(() => ShipmentAddressDto)
  address: ShipmentAddressDto;

  @Expose()
  @IsString()
  @TrimString()
  paymentMethodId: string;

  @Expose()
  @IsBoolean()
  isCallbackNeeded: boolean;

  @Expose()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ClientOrderItemDto)
  items: ClientOrderItemDto[];

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  clientNote: string;
}

export class ClientOrderDto extends ClientAddOrderDto implements
  Pick<Order, 'shipment' | 'createdAt'>,
  Record<keyof Pick<Order, 'prices'>, ClientOrderPricesDto>,
  Record<keyof Pick<Order, 'shippingMethodName'>, string>
{
  @Expose()
  id: string;

  @Expose()
  shippingMethodName: string;

  @Expose()
  paymentMethodName: string;

  @Expose()
  shipment: ShipmentDto;

  @Expose()
  status: string;

  @Expose()
  prices: ClientOrderPricesDto;

  @Expose()
  createdAt: Date;

  @Expose()
  isOnlinePayment: boolean;

  static transformToDto(order: Order | AdminOrderDto, lang: Language): ClientOrderDto {
    const orderItems = order.items as (OrderItem | AdminOrderItemDto)[];
    return {
      address: order.shipment.recipient,
      clientNote: order.clientNote,
      createdAt: order.createdAt,
      email: order.customerEmail,
      id: order.idForCustomer,
      isCallbackNeeded: order.isCallbackNeeded,
      isOnlinePayment: order.paymentType === PaymentTypeEnum.ONLINE_PAYMENT,
      items: orderItems.map(item => ClientOrderItemDto.transformToDto(item, lang)),
      paymentMethodId: order.paymentMethodId,
      paymentMethodName: order.paymentMethodClientName[lang],
      prices: ClientOrderPricesDto.transformToDto(order.prices, lang),
      shipment: order.shipment,
      shippingMethodName: order.shippingMethodName[lang],
      status: order.statusDescription[lang]
    };
  }
}
