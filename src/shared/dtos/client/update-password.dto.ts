import { IsString, Matches } from 'class-validator';
import { clientDefaultLanguage, validPasswordRegex } from '../../constants';
import { TrimString } from '../../decorators/trim-string.decorator';
import { __ } from '../../helpers/translate/translate.function';

export class ClientUpdatePasswordDto {
  @IsString()
  @TrimString()
  currentPassword: string;

  @Matches(validPasswordRegex, { message: __('Password must be at least 8 characters long, consist of numbers and Latin letters, including capital letters', clientDefaultLanguage) })
  newPassword: string;
}
