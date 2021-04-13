import { Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEmail, IsNumber, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';
import { ShipmentAddressDto } from '../shared-dtos/shipment-address.dto';
import { normalizePhoneNumber } from '../../helpers/normalize-phone-number.function';
import { TrimString } from '../../decorators/trim-string.decorator';
import { Customer } from '../../../customer/models/customer.model';
import { ContactInfoDto } from '../shared-dtos/contact-info.dto';
import { CustomerContactInfoDto } from '../shared-dtos/customer-contact-info.dto';

export class AdminAddOrUpdateCustomerDto implements
  Pick<Customer, 'contactInfo' | 'createdAt' | 'lastLoggedIn' | 'isLocked' | 'isEmailConfirmed' | 'isPhoneNumberConfirmed' | 'addresses' | 'note' | 'deprecatedAddresses' | 'totalOrdersCost' | 'discountPercent' | 'orderIds' | 'storeReviewIds' | 'productReviewIds' | 'wishlistProductIds' | 'oauthId' | 'isRegisteredByThirdParty'> {
  @Expose()
  @Type(() => CustomerContactInfoDto)
  contactInfo: CustomerContactInfoDto;

  @Expose()
  @IsOptional()
  password: any;

  @Expose()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastLoggedIn: Date;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isLocked: boolean;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isEmailConfirmed: boolean;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isPhoneNumberConfirmed: boolean;

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
  deprecatedAddresses: string[];

  @Expose()
  @IsNumber(undefined, { each: true })
  storeReviewIds: number[];

  @Expose()
  @IsNumber(undefined, { each: true })
  productReviewIds: number[];

  @Expose()
  @IsNumber(undefined, { each: true })
  orderIds: number[];

  @Expose()
  @IsNumber(undefined, { each: true })
  wishlistProductIds: number[];

  @Expose()
  @IsOptional()
  @IsNumber()
  discountPercent: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  totalOrdersCost: number;

  oauthId: string;

  isRegisteredByThirdParty: boolean;
}

export class AdminCustomerDto extends AdminAddOrUpdateCustomerDto {
  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id: number;
}
