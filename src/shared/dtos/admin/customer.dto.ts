import { Expose, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsDefined,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested
} from 'class-validator';

export class AdminCustomerAddressDto {
  @Expose()
  @IsString()
  firstName: string;

  @Expose()
  @IsString()
  lastName: string;

  @Expose()
  @IsOptional()
  @IsString()
  phoneNumber: string;

  @Expose()
  @IsString()
  city: string;

  @Expose()
  @IsOptional()
  @IsString()
  streetName: string;

  @Expose()
  @IsOptional()
  @IsString()
  novaposhtaOffice: any;
}

export class AdminAddOrUpdateCustomerDto {
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
  creationDate: Date;

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
  @Type(() => AdminCustomerAddressDto)
  addresses: AdminCustomerAddressDto[];

  @Expose()
  @IsNumber(undefined, { each: true })
  reviewIds: number[];

  @Expose()
  @IsNumber(undefined, { each: true })
  orderIds: number[];

  @Expose()
  @IsNumber(undefined, { each: true })
  wishlistProductIds: number[];
}

export class AdminCustomerDto extends AdminAddOrUpdateCustomerDto {
  @Expose()
  @Transform(((value, obj) => value ? value : obj._id && obj._id.toString()))
  id: number;
}
