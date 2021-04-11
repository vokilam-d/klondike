import { Expose, Transform, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsDate, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { BaseShipmentDto } from '../shared-dtos/base-shipment.dto';
import { OrderStatusEnum } from '../../enums/order-status.enum';
import { getTranslations } from '../../helpers/translate/translate.function';
import { PaymentTypeEnum } from '../../enums/payment-type.enum';
import { Log } from '../../models/log.model';
import { Order } from '../../../order/models/order.model';
import { TrimString } from '../../decorators/trim-string.decorator';
import { AdminOrderItemDto } from './order-item.dto';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';
import { AdminOrderPricesDto } from './order-prices.dto';
import { AdminLogDto } from './log.dto';
import { ManagerDto } from './manager.dto';
import { AdminMediaDto } from './media.dto';
import { OrderContactInfoDto } from '../shared-dtos/order-contact-info.dto';

export class AdminAddOrUpdateOrderDto implements Pick<Order, 'customerId' | 'customerFirstName' | 'customerLastName' | 'customerPhoneNumber' | 'customerNote' | 'createdAt' | 'paymentMethodId' | 'paymentType' | 'isCallbackNeeded' | 'shipment' | 'items' | 'status' | 'clientNote' | 'adminNote' | 'logs' | 'prices' | 'isOrderPaid' | 'manager' | 'medias'> {
  @Expose()
  @IsOptional()
  @IsNumber()
  customerId: number;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  customerFirstName: string;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  customerLastName: string;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  customerEmail: string;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  customerPhoneNumber: string;

  @Expose()
  customerNote: string;

  @Expose()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @IsString()
  @TrimString()
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
  @Type(() => BaseShipmentDto)
  shipment: BaseShipmentDto;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => ManagerDto)
  manager: ManagerDto;

  @Expose()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AdminOrderItemDto)
  items: AdminOrderItemDto[];

  @Expose()
  status: OrderStatusEnum;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  clientNote: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  adminNote: string;

  @Expose()
  @IsOptional()
  logs: Log[];

  @Expose()
  @Type(() => AdminOrderPricesDto)
  prices: AdminOrderPricesDto;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isOrderPaid: boolean;

  @Expose()
  @IsOptional()
  @Type(() => AdminMediaDto)
  medias: AdminMediaDto[];
}

export class AdminOrderDto extends AdminAddOrUpdateOrderDto implements Pick<Order, 'id' | 'idForCustomer' | 'paymentMethodClientName' | 'paymentMethodAdminName' | 'shippingMethodName' | 'source' | 'logs' | 'shippedAt'> {
  @Expose()
  id: number;

  @Expose()
  idForCustomer: string;

  @Expose()
  @Type(() => MultilingualTextDto)
  statusDescription: MultilingualTextDto;

  @Expose()
  customerContactInfo: OrderContactInfoDto;

  @Expose()
  @IsOptional()
  @Type(() => MultilingualTextDto)
  paymentMethodClientName: MultilingualTextDto;

  @Expose()
  @IsOptional()
  @Type(() => MultilingualTextDto)
  paymentMethodAdminName: MultilingualTextDto;

  @Expose()
  @Type(() => MultilingualTextDto)
  shippingMethodName: MultilingualTextDto;

  @Expose()
  source: 'client' | 'manager';

  @Expose()
  @Type(() => AdminLogDto)
  logs: AdminLogDto[];

  @Expose()
  @Type(() => Date)
  shippedAt: Date;
}

export class UpdateOrderAdminNote implements Pick<Order, 'adminNote'> {
  @IsString()
  adminNote: string;
}

export class UpdateOrderManager implements Pick<ManagerDto, 'userId'> {
  @IsString()
  userId: string;
}
