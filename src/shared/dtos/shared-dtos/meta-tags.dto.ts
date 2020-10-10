import { IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { TrimString } from '../../decorators/trim-string.decorator';

export class MetaTagsDto {
  @Expose()
  @IsString()
  @TrimString()
  title: string;

  @Expose()
  @IsString()
  @TrimString()
  keywords: string;

  @Expose()
  @IsString()
  @TrimString()
  description: string;
}
