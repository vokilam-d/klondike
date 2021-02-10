import { Expose, Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { adminDefaultLanguage, validPasswordRegex } from '../../constants';
import { __ } from '../../helpers/translate/translate.function';
import { Role } from '../../enums/role.enum';

export class AddOrUpdateUserDto {
  @Expose()
  @IsString()
  login: string;

  @Expose()
  @IsString()
  name: string;

  @Matches(validPasswordRegex, { message: __('Password must be at least 8 characters long, consist of numbers and Latin letters, including capital letters', adminDefaultLanguage) })
  password?: string;

  @Expose()
  @IsEnum(Role)
  role: Role;
}

export class UserDto extends AddOrUpdateUserDto {
  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id: string;
}
