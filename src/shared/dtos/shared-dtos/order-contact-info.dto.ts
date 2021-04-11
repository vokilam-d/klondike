import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';
import { ContactInfoDto } from './contact-info.dto';

export class OrderContactInfoDto extends ContactInfoDto {
  @Expose()
  @IsString()
  @TrimString()
  email: string;
}
