import { IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class MetaTagsDto {
  @Expose()
  @IsString()
  title: string;

  @Expose()
  @IsString()
  keywords: string;

  @Expose()
  @IsString()
  description: string;
}
