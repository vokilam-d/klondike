import { Expose, Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ShipmentAddressDto } from '../shared-dtos/shipment-address.dto';
import { TrimString } from '../../decorators/trim-string.decorator';
import { Customer } from '../../../customer/models/customer.model';
import { CustomerContactInfoDto } from '../shared-dtos/customer-contact-info.dto';
import { AdminOrderItemDto } from './order-item.dto';

export class AdminAddOrUpdateCustomerDto implements Pick<Customer, 'contactInfo' | 'addresses' | 'note' | 'discountPercent'> {
  @Expose()
  @Type(() => CustomerContactInfoDto)
  contactInfo: CustomerContactInfoDto;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  note: string;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => ShipmentAddressDto)
  addresses: ShipmentAddressDto[];

  @Expose()
  @IsOptional()
  @IsNumber()
  discountPercent: number;
}

export class AdminCustomerDto extends AdminAddOrUpdateCustomerDto implements Omit<Customer, 'deprecatedPasswordHash' | '_id'> {
  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id: number;

  @Expose()
  password: any;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @Type(() => Date)
  lastLoggedIn: Date;

  @Expose()
  isLocked: boolean;

  @Expose()
  isEmailConfirmed: boolean;

  @Expose()
  isPhoneNumberConfirmed: boolean;

  @Expose()
  deprecatedAddresses: string[];

  @Expose()
  storeReviewIds: number[];

  @Expose()
  productReviewIds: number[];

  @Expose()
  orderIds: number[];

  @Expose()
  wishlistProductIds: number[];

  @Expose()
  totalOrdersCost: number;

  @Expose()
  oauthId: string;

  @Expose()
  isRegisteredByThirdParty: boolean;

  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  @Expose()
  totalOrdersCount: number;

  @Expose()
  @Type(() => AdminOrderItemDto)
  cart: AdminOrderItemDto[];
}
