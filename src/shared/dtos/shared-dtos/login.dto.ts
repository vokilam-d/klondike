import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeEmailOrPhoneNumber } from '../../helpers/normalize-email-or-phone-number.function';
import { TrimString } from '../../decorators/trim-string.decorator';

export class LoginDto {
  @IsString()
  @TrimString()
  @Transform(value => normalizeEmailOrPhoneNumber(value))
  login: string;

  @IsString()
  @TrimString()
  password: string;
}
