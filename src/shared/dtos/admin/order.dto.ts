import { Expose, Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';
import { OrderItemDto } from '../shared-dtos/order-item.dto';
import { ShippingAddressDto } from '../shared-dtos/shipping-address.dto';

export class AdminAddOrUpdateOrderDto {
  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id: number; // todo remove after migration

  @Expose()
  @IsOptional()
  @IsString()
  idForCustomer: string; // todo remove after migration

  @Expose()
  @IsOptional()
  @IsNumber()
  customerId: number;

  @Expose()
  @IsOptional()
  @IsString()
  customerFirstName: string;

  @Expose()
  @IsOptional()
  @IsString()
  customerLastName: string;

  @Expose()
  @IsOptional()
  @IsString()
  customerEmail: string;

  @Expose()
  @IsOptional()
  @IsString()
  customerPhoneNumber: string;

  @Expose()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  address: ShippingAddressDto;

  @Expose()
  @IsBoolean()
  shouldSaveAddress: boolean;

  @Expose()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isConfirmationEmailSent: boolean;

  @Expose()
  @IsString()
  paymentMethodId: string;

  @Expose()
  @IsString()
  paymentMethodClientName: string; // todo remove after migration

  @Expose()
  @IsString()
  paymentMethodAdminName: string; // todo remove after migration

  @Expose()
  @IsString()
  shippingMethodId: string;

  @Expose()
  @IsString()
  shippingMethodClientName: string; // todo remove after migration

  @Expose()
  @IsString()
  shippingMethodAdminName: string; // todo remove after migration

  @Expose()
  @IsBoolean()
  isCallbackNeeded: boolean;

  @Expose()
  @IsOptional()
  novaposhtaTrackingId: any;

  @Expose()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @Expose()
  state: any;

  @Expose()
  status: any;

  @Expose()
  @IsString()
  clientNote: string;

  @Expose()
  @IsString()
  adminNote: string;

  @Expose()
  @IsString({ each: true })
  logs: string[];

  @Expose()
  @IsOptional()
  @IsNumber()
  totalItemsCost: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  discountPercent: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  discountValue: number;

  @Expose()
  @IsOptional()
  @IsString()
  discountLabel: string;

  @Expose()
  @IsOptional()
  @IsNumber()
  totalCost: number;
}

export class AdminOrderDto extends AdminAddOrUpdateOrderDto {
  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id: number;

  @Expose()
  @IsOptional()
  @IsString()
  idForCustomer: string;

  @Expose()
  shippingMethodClientName: string;

  @Expose()
  shippingMethodAdminName: string;

  @Expose()
  paymentMethodClientName: string;

  @Expose()
  paymentMethodAdminName: string;
}
