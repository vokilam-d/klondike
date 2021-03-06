import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeEmailOrPhoneNumber } from '../../helpers/normalize-email-or-phone-number.function';

export class InitResetPasswordDto {
  @IsEmail()
  @Transform(value => normalizeEmailOrPhoneNumber(value))
  login: string;
}
