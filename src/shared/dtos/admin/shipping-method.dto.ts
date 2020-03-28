import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsString, Matches } from 'class-validator';
import { notEmptyStringRegex } from '../../constants';

export class AdminShippingMethodDto {
  @Expose()
  @Transform(((value, obj) => value ? value : obj._id && obj._id.toString()))
  id: string;

  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @IsString()
  @Matches(notEmptyStringRegex, { message: 'Field \'clientName\' should not be empty'})
  clientName: string;

  @Expose()
  @IsString()
  @Matches(notEmptyStringRegex, { message: 'Field \'adminName\' should not be empty'})
  adminName: string;

  @Expose()
  @IsNumber()
  price: number;

  @Expose()
  @IsNumber()
  sortOrder: number;
}
