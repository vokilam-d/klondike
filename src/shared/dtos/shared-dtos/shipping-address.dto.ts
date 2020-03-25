import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ShippingAddressDto {
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

  @Expose()
  @IsOptional()
  @IsBoolean()
  isDefault: boolean;
}
