import { ArrayMinSize, IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { Order } from '../../../order/models/order.model';
import { ShipmentDto } from '../admin/shipment.dto';
import { ShipmentAddressDto } from '../shared-dtos/shipment-address.dto';
import { __ } from '../../helpers/translate/translate.function';
import { AdminOrderDto } from '../admin/order.dto';
import { TrimString } from '../../decorators/trim-string.decorator';
import { ClientOrderItemDto } from './order-item.dto';
import { ClientOrderPricesDto } from './order-prices.dto';
import { clientDefaultLanguage } from '../../constants';

export class ClientAddOrderDto implements
  Pick<Order, 'paymentMethodId' | 'isCallbackNeeded' | 'clientNote'>,
  Record<keyof Pick<Order, 'items'>, ClientOrderItemDto[]>
{
  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  @Transform(((value, obj: Order) => value ? value : obj.customerEmail))
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
  Pick<Order, 'shipment' | 'shippingMethodName' | 'createdAt'>,
  Record<keyof Pick<Order, 'prices'>, ClientOrderPricesDto>
{
  @Expose()
  @Transform(((value, obj: Order) => obj.idForCustomer))
  id: string;

  @Expose()
  shippingMethodName: string;

  @Expose()
  @Transform(((value, obj: Order) => value ? value : obj.paymentMethodClientName[clientDefaultLanguage]))
  paymentMethodName: string;

  @Expose()
  @Type(() => ShipmentDto)
  shipment: ShipmentDto;

  @Expose()
  @Transform(((value, order: AdminOrderDto) => order.statusDescription || __(order.status, clientDefaultLanguage) || value))
  status: string;

  @Expose()
  @Type(() => ClientOrderPricesDto)
  prices: ClientOrderPricesDto;

  @Expose()
  createdAt: Date;

  @Expose()
  isOnlinePayment: boolean;
}
