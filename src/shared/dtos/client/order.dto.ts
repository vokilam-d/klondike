import { ArrayMinSize, IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { OrderItemDto } from '../shared-dtos/order-item.dto';
import { Order } from '../../../order/models/order.model';
import { OrderStatusEnum } from '../../enums/order-status.enum';
import { ShipmentAddressDto } from '../shared-dtos/shipment-address.dto';

export class ClientAddOrderDto {
  @Expose()
  @IsOptional()
  @IsString()
  email: string;

  @Expose()
  @ValidateNested()
  @Type(() => ShipmentAddressDto)
  address: ShipmentAddressDto;

  @Expose()
  @IsString()
  paymentMethodId: string;

  @Expose()
  @IsString()
  shippingMethodId: string;

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
  @Transform(((value, obj: Order) => value ? value : obj.clientNote))
  @IsOptional()
  @IsString()
  note: string;
}

export class ClientOrderDto extends ClientAddOrderDto {
  @Expose()
  @Transform(((value, obj: Order) => obj.idForCustomer))
  id: string;

  @Expose()
  @Transform(((value, obj: Order) => value ? value : obj.shippingMethodClientName))
  shippingMethodName: string;

  @Expose()
  @Transform(((value, obj: Order) => value ? value : obj.paymentMethodClientName))
  paymentMethodName: string;

  @Expose()
  @Transform(((value, obj: Order) => value ? value : obj.shipment?.trackingNumber))
  novaposhtaTrackingId: string;

  @Expose()
  status: OrderStatusEnum;

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
}
