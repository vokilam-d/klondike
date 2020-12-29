import { IsOptional, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';
import { MultilingualText } from '../../models/multilingual-text.model';
import { Expose } from 'class-transformer';

export class MultilingualTextDto implements MultilingualText {
  @Expose()
  @IsString()
  @TrimString()
  ru: string;

  @Expose()
  @IsString()
  @TrimString()
  uk: string;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  en: string;
}
