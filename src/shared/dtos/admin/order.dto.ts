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
import { ShipmentDto } from './shipment.dto';
import { OrderStatusEnum } from '../../enums/order-status.enum';
import { __ } from '../../helpers/translate/translate.function';
import { PaymentTypeEnum } from '../../enums/payment-type.enum';
import { Log } from '../../models/log.model';

export class AdminAddOrUpdateOrderDto {
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
  customerNote: string;

  @Expose()
  @IsBoolean()
  @IsOptional()
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
  paymentType: PaymentTypeEnum;

  @Expose()
  @IsBoolean()
  @IsOptional()
  isCallbackNeeded: boolean;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => ShipmentDto)
  shipment: ShipmentDto;

  @Expose()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @Expose()
  state: any;

  @Expose()
  status: OrderStatusEnum;

  @Expose()
  @IsString()
  @IsOptional()
  clientNote: string;

  @Expose()
  @IsString()
  @IsOptional()
  adminNote: string;

  @Expose()
  @IsOptional()
  logs: Log[];

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

  @Expose()
  @IsOptional()
  @IsBoolean()
  isOrderPaid: boolean;
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
  @Transform(((value, order: AdminOrderDto) => value || __(order.status, 'ru')))
  statusDescription: string;

  @Expose()
  @IsString()
  @IsOptional()
  paymentMethodClientName: string;

  @Expose()
  @IsString()
  @IsOptional()
  paymentMethodAdminName: string;

  @Expose()
  @IsString()
  @IsOptional()
  shippingMethodName: string;
}

export class UpdateOrderAdminNote {
  @IsString()
  adminNote: string;
}
