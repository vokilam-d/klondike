import { Exclude, Expose, Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ShipmentAddressDto {

  @Exclude()
  _id?: any;

  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id?: string;

  @Expose()
  @IsOptional()
  addressType?: string;

  @Expose()
  @IsString()
  @IsOptional()
  settlementId?: string;

  @Expose()
  @IsString()
  @IsOptional()
  settlement?: string;

  @Expose()
  @IsString()
  @IsOptional()
  addressId?: string;

  @Expose()
  @IsString()
  @IsOptional()
  address?: string;

  @Expose()
  @IsString()
  @IsOptional()
  phone?: string;

  @Expose()
  @IsString()
  @IsOptional()
  firstName?: string;

  @Expose()
  @IsString()
  @IsOptional()
  lastName?: string;

  @Expose()
  @IsString()
  @IsOptional()
  middleName?: string;

  @Expose()
  @IsString()
  @IsOptional()
  buildingNumber?: string;

  @Expose()
  @IsString()
  @IsOptional()
  flat?: string;

  @Expose()
  @IsString()
  @IsOptional()
  note?: string;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

}