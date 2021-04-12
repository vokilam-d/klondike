import { Expose, Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';
import { ContactInfo } from '../../models/contact-info.model';
import { normalizePhoneNumber } from '../../helpers/normalize-phone-number.function';

export class ContactInfoDto implements ContactInfo {
  @Expose()
  @IsString()
  @TrimString()
  lastName: string;

  @Expose()
  @IsString()
  @TrimString()
  firstName: string;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  middleName?: string;

  @Expose()
  @IsString()
  @TrimString()
  @Transform(value => normalizePhoneNumber(value))
  phoneNumber: string;
}
