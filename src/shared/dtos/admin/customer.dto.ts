import { Expose, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested
} from 'class-validator';
import { ShipmentAddressDto } from '../shared-dtos/shipment-address.dto';

export class AdminAddOrUpdateCustomerDto {
  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id: number; // todo remove after migrate

  @Expose()
  @IsString()
  firstName: string;

  @Expose()
  @IsString()
  lastName: string;

  @Expose()
  @IsOptional()
  @ValidateIf(c => c.email !== '')
  @IsEmail()
  email: string;

  @Expose()
  @IsOptional()
  @IsString()
  phoneNumber: string;

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
  note: string;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => ShipmentAddressDto)
  addresses: ShipmentAddressDto[];

  @Expose()
  @IsNumber(undefined, { each: true })
  reviewIds: number[];

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

  isRegisteredByThirdParty?: boolean;
}

export class AdminCustomerDto extends AdminAddOrUpdateCustomerDto {
  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id: number;
}
