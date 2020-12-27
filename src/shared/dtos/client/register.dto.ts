import { IsEmail, IsString, Matches } from 'class-validator';
import { clientDefaultLanguage, validPasswordRegex } from '../../constants';
import { TrimString } from '../../decorators/trim-string.decorator';
import { __ } from '../../helpers/translate/translate.function';

export class ClientRegisterDto {
  @IsString()
  @TrimString()
  firstName: string;

  @IsString()
  @TrimString()
  lastName: string;

  @IsEmail()
  email: string;

  @Matches(validPasswordRegex, { message: __('Password must be at least 8 characters long, consist of numbers and Latin letters, including capital letters', clientDefaultLanguage) })
  password: string;
}
