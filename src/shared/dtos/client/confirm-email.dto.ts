import { IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';

export class ConfirmEmailDto {
  @IsString()
  @TrimString()
  token: string;
}
