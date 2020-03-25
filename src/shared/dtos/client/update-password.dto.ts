import { IsString, Matches } from 'class-validator';
import { validPasswordRegex } from '../../constants';

export class ClientUpdatePasswordDto {
  @IsString()
  currentPassword: string;

  @Matches(validPasswordRegex, { message: 'Пароль должен быть не менее 6 символов, состоять из цифр и латинских букв, в том числе заглавных' })
  newPassword: string;
}
