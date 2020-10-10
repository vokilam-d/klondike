import { IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';

export class ResetPasswordDto {
  @IsString()
  @TrimString()
  password: string;

  @IsString()
  @TrimString()
  token: string;
}
