import { IsEmail, IsString, Matches } from 'class-validator';
import { validPasswordRegex } from '../../constants';
import { TrimString } from '../../decorators/trim-string.decorator';

export class ClientRegisterDto {
  @IsString()
  @TrimString()
  firstName: string;

  @IsString()
  @TrimString()
  lastName: string;

  @IsEmail()
  email: string;

  @Matches(validPasswordRegex, { message: 'Пароль должен быть не менее 6 символов, состоять из цифр и латинских букв, в том числе заглавных' })
  password: string;
}
