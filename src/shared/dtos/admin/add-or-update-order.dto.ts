import { Order } from '../../../order/models/order.model';
import { Expose, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsDate, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';
import { PaymentTypeEnum } from '../../enums/payment-type.enum';
import { BaseShipmentDto } from '../shared-dtos/base-shipment.dto';
import { ManagerDto } from './manager.dto';
import { AdminOrderItemDto } from './order-item.dto';
import { OrderStatusEnum } from '../../enums/order-status.enum';
import { Log } from '../../models/log.model';
import { AdminOrderPricesDto } from './order-prices.dto';
import { AdminMediaDto } from './media.dto';
import { ClientOrderItemDto } from '../client/order-item.dto';
import { CustomerContactInfoDto } from '../shared-dtos/customer-contact-info.dto';
import { ContactInfoDto } from '../shared-dtos/contact-info.dto';
import { ShipmentAddressDto } from '../shared-dtos/shipment-address.dto';

export class AdminAddOrUpdateOrderDto implements
  Pick<Order, 'isCallbackNeeded' | 'customerId' | 'manager' | 'prices'>,
  Record<keyof Pick<Order, 'items'>, AdminOrderItemDto[]>
{
  @IsOptional()
  @IsNumber()
  customerId: number;

  @ValidateNested()
  @Type(() => CustomerContactInfoDto)
  customerContactInfo: CustomerContactInfoDto;

  @ValidateNested()
  @Type(() => ContactInfoDto)
  recipientContactInfo: ContactInfoDto;

  @ValidateNested()
  @Type(() => ShipmentAddressDto)
  address: ShipmentAddressDto;

  @IsString()
  @TrimString()
  paymentMethodId: string;

  @IsBoolean()
  isCallbackNeeded: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AdminOrderItemDto)
  items: AdminOrderItemDto[];

  @IsOptional()
  @IsString()
  @TrimString()
  note: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ManagerDto)
  manager: ManagerDto;

  @ValidateNested()
  @Type(() => AdminOrderPricesDto)
  prices: AdminOrderPricesDto;
}
