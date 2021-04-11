import { Exclude, Expose, Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { AddressTypeEnum } from '../../enums/address-type.enum';
import { normalizePhoneNumber } from '../../helpers/normalize-phone-number.function';
import { TrimString } from '../../decorators/trim-string.decorator';
import { ShipmentAddress } from '../../models/shipment-address.model';

export class ShipmentAddressDto implements ShipmentAddress {
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
  settlementFull?: string;

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
  addressFull?: string;

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
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

}
