import { ArrayMinSize, IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { OrderItemDto } from '../shared-dtos/order-item.dto';
import { Order } from '../../../order/models/order.model';
import { ShipmentDto } from '../admin/shipment.dto';
import { ShipmentAddressDto } from '../shared-dtos/shipment-address.dto';
import { __ } from '../../helpers/translate/translate.function';

export class ClientAddOrderDto {
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

export class ClientOrderDto extends ClientAddOrderDto {
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
  @Transform(((value, order: ClientOrderDto) => value || __(order.status, 'ru')))
  status: string;

  @Expose()
  totalItemsCost: number;

  @Expose()
  discountPercent: number;

  @Expose()
  discountValue: number;

  @Expose()
  discountLabel: string;

  @Expose()
  totalCost: number;

  @Expose()
  createdAt: Date;

  @Expose()
  isOnlinePayment: boolean;
}
