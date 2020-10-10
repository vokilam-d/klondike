import { Exclude, Expose, Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { AddressTypeEnum } from '../../enums/address-type.enum';
import { normalizePhoneNumber } from '../../helpers/normalize-phone-number.function';
import { TrimString } from '../../decorators/trim-string.decorator';

export class ShipmentAddressDto {

  @Exclude()
  _id?: any;

  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id?: string;

  @Expose()
  @IsEnum(AddressTypeEnum)
  @IsOptional()
  addressType?: AddressTypeEnum;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  settlementId?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  settlement?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  addressId?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  address?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  @Transform(value => normalizePhoneNumber(value))
  phone?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  firstName?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  lastName?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  middleName?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  buildingNumber?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  flat?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  note?: string;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

}
