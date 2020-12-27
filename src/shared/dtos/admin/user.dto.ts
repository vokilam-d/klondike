import { Expose, Transform } from 'class-transformer';
import { Matches } from 'class-validator';
import { adminDefaultLanguage, validPasswordRegex } from '../../constants';
import { __ } from '../../helpers/translate/translate.function';

export class UserDto {
  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id: string;

  @Expose()
  login: string;
}

export class AddOrUpdateUserDto extends UserDto {
  @Matches(validPasswordRegex, { message: __('Password must be at least 8 characters long, consist of numbers and Latin letters, including capital letters', adminDefaultLanguage) })
  password: string;
}
