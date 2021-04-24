import { Order } from '../../../order/models/order.model';
import { ClientOrderItemDto } from './order-item.dto';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CustomerContactInfoDto } from '../shared-dtos/customer-contact-info.dto';
import { ContactInfoDto } from '../shared-dtos/contact-info.dto';
import { ShipmentAddressDto } from '../shared-dtos/shipment-address.dto';
import { TrimString } from '../../decorators/trim-string.decorator';

export class ClientAddOrderDto implements
  Pick<Order, 'isCallbackNeeded'>,
  Record<keyof Pick<Order, 'items'>, ClientOrderItemDto[]>
{
  @ValidateNested()
  @Type(() => CustomerContactInfoDto)
  customerContactInfo: CustomerContactInfoDto;

  @ValidateNested()
  @Type(() => ContactInfoDto)
  @IsOptional()
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
  @Type(() => ClientOrderItemDto)
  items: ClientOrderItemDto[];

  @IsOptional()
  @IsString()
  @TrimString()
  note: string;
}
