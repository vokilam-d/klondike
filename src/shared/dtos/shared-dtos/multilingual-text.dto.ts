import { IsOptional, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';
import { MultilingualText } from '../../models/multilingual-text.model';

export class MultilingualTextDto implements MultilingualText {
  @IsString()
  @TrimString()
  ru: string;

  @IsString()
  @TrimString()
  uk: string;

  @IsOptional()
  @IsString()
  @TrimString()
  en: string;
}
