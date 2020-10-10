import { IsString, Matches } from 'class-validator';
import { validPasswordRegex } from '../../constants';
import { TrimString } from '../../decorators/trim-string.decorator';

export class ClientUpdatePasswordDto {
  @IsString()
  @TrimString()
  currentPassword: string;

  @Matches(validPasswordRegex, { message: 'Пароль должен быть не менее 6 символов, состоять из цифр и латинских букв, в том числе заглавных' })
  newPassword: string;
}
