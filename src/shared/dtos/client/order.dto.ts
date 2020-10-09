import { ArrayMinSize, IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { OrderItemDto } from '../shared-dtos/order-item.dto';
import { Order } from '../../../order/models/order.model';
import { ShipmentDto } from '../admin/shipment.dto';
import { ShipmentAddressDto } from '../shared-dtos/shipment-address.dto';
import { __ } from '../../helpers/translate/translate.function';
import { AdminOrderDto } from '../admin/order.dto';
import { OrderPricesDto } from '../shared-dtos/order-prices.dto';

export class ClientAddOrderDto implements Pick<Order, 'paymentMethodId' | 'isCallbackNeeded' | 'items' | 'clientNote'> {
  @Expose()
  @IsOptional()
  @IsString()
  @Transform(((value, obj: Order) => value ? value : obj.customerEmail))
  email: string;

  @Expose()
  @ValidateNested()
  @Type(() => ShipmentAddressDto)
  address: ShipmentAddressDto;

  @Expose()
  @IsString()
  paymentMethodId: string;

  @Expose()
  @IsBoolean()
  isCallbackNeeded: boolean;

  @Expose()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @Expose()
  @IsOptional()
  @IsString()
  clientNote: string;
}

export class ClientOrderDto extends ClientAddOrderDto implements Pick<Order, 'shipment' | 'shippingMethodName' | 'prices' | 'createdAt'> {
  @Expose()
  @Transform(((value, obj: Order) => obj.idForCustomer))
  id: string;

  @Expose()
  shippingMethodName: string;

  @Expose()
  @Transform(((value, obj: Order) => value ? value : obj.paymentMethodClientName))
  paymentMethodName: string;

  @Expose()
  @Type(() => ShipmentDto)
  shipment: ShipmentDto;

  @Expose()
  @Transform(((value, order: AdminOrderDto) => order.statusDescription || __(order.status, 'ru') || value))
  status: string;

  @Expose()
  @Type(() => OrderPricesDto)
  prices: OrderPricesDto;

  @Expose()
  createdAt: Date;

  @Expose()
  isOnlinePayment: boolean;
}
