import { Exclude, Expose, Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';
import { validPasswordRegex } from '../../constants';

export class UserDto {
  @Expose()
  @Transform(((value, obj) => obj._id?.toString()))
  id: string;

  @Expose()
  login: string;
}

export class AddOrUpdateUserDto extends UserDto {
  @Matches(validPasswordRegex, { message: 'Пароль должен быть не менее 6 символов, состоять из цифр и латинских букв, в том числе заглавных' })
  password: string;
}
