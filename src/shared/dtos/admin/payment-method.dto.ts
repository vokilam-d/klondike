import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsString, Matches } from 'class-validator';
import { notEmptyStringRegex } from '../../constants';
import { TrimString } from '../../decorators/trim-string.decorator';

export class AdminPaymentMethodDto {
  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id: string;

  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @IsString()
  @TrimString()
  @Matches(notEmptyStringRegex, { message: 'Field \'clientName\' should not be empty'})
  clientName: string;

  @Expose()
  @IsString()
  @TrimString()
  @Matches(notEmptyStringRegex, { message: 'Field \'adminName\' should not be empty'})
  adminName: string;

  @Expose()
  @IsNumber()
  price: number;

  @Expose()
  @IsNumber()
  sortOrder: number;
}
