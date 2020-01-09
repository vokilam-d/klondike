import { Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsString, ValidateNested } from 'class-validator';
import { AdminShippingAddressDto } from './customer.dto';
import { AdminOrderItemDto } from './order-item.dto';

export class AdminAddOrUpdateOrderDto {
  @Expose()
  @IsNumber()
  customerId: number;

  @Expose()
  @ValidateNested()
  @Type(() => AdminShippingAddressDto)
  address: AdminShippingAddressDto;

  @Expose()
  @IsDate()
  @Type(() => Date)
  dateCreated: Date;

  @Expose()
  @IsBoolean()
  isConfirmationEmailSent: boolean;

  @Expose()
  paymentMethod: any;

  @Expose()
  shippingMethod: any;

  @Expose()
  @IsBoolean()
  isCallbackNeeded: boolean;

  @Expose()
  novaposhtaTrackingId: any;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminOrderItemDto)
  items: AdminOrderItemDto[];

  @Expose()
  status: any;

  @Expose()
  @IsString()
  notes: string[];

  @Expose()
  @IsNumber()
  orderTotalPrice: number;

  @Expose()
  @IsNumber(undefined, { each: true })
  invoiceIds: number[];

  @Expose()
  @IsNumber(undefined, { each: true })
  shipmentIds: number[];

  @Expose()
  attributes: any[];
}

export class AdminOrderDto extends AdminAddOrUpdateOrderDto {
  @Expose()
  @Transform(((value, obj) => value ? value : obj._id && obj._id.toString()))
  id: number;
}
