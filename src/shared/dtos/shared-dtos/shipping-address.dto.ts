import { Exclude, Expose, Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { normalizePhoneNumber } from '../../helpers/normalize-phone-number.function';

export class ShippingAddressDto {
  @Exclude()
  _id?: any;

  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id?: string;

  @Expose()
  @IsString()
  firstName: string;

  @Expose()
  @IsString()
  lastName: string;

  @Expose()
  @IsOptional()
  @IsString()
  @Transform(value => normalizePhoneNumber(value))
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
