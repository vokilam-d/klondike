import { Exclude, Expose, Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { AddressTypeEnum } from '../../enums/address-type.enum';
import { TrimString } from '../../decorators/trim-string.decorator';
import { ShipmentAddress } from '../../models/shipment-address.model';

export class ShipmentAddressDto implements ShipmentAddress {
  @Exclude()
  _id?: any;

  @Expose()
  @Transform(((value, obj) => obj._id || value))
  @IsOptional()
  id?: string;

  @Expose()
  @IsEnum(AddressTypeEnum)
  @IsOptional()
  type?: AddressTypeEnum;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  settlementId?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  settlementName?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  settlementNameFull?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  addressId?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  addressName?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  addressNameFull?: string;

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
