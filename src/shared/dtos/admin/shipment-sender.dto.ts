import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { AddressTypeEnum } from '../../enums/address-type.enum';
import { TrimString } from '../../decorators/trim-string.decorator';

export class ShipmentSenderDto {

  @Expose()
  @IsOptional()
  id?: number;

  @Expose()
  @IsEnum(AddressTypeEnum)
  @IsOptional()
  addressType?: AddressTypeEnum;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  city?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  cityId?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  senderId?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  contactId?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  counterpartyRef?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  addressId?: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
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
  address?: string;

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
  isDefault?: boolean;

}
