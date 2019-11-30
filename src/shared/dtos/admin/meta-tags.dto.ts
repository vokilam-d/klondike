import { IsString } from 'class-validator';

export class MetaTagsDto {
  @IsString()
  title: string;

  @IsString()
  keywords: string;

  @IsString()
  description: string;
}
