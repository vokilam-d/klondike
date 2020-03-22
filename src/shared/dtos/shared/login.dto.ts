import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeEmailOrPhoneNumber } from '../../helpers/normalize-email-or-phone-number.function';

export class LoginDto {
  @IsString()
  @Transform(value => normalizeEmailOrPhoneNumber(value))
  login: string;

  @IsString()
  password: string;
}
