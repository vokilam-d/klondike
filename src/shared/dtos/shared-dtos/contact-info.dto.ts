import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';

export class ContactInfoDto {
  @Expose()
  @IsString()
  @TrimString()
  lastName: string;

  @Expose()
  @IsString()
  @TrimString()
  firstName: string;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  middleName?: string;

  @Expose()
  @IsString()
  @TrimString()
  phoneNumber: string;
}
