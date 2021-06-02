import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';
import { MultilingualTextDto } from './multilingual-text.dto';

export abstract class BaseBreadcrumbDto {
  @Expose()
  @IsNumber()
  id: number;

  abstract name: MultilingualTextDto | string;

  @Expose()
  @IsString()
  @TrimString()
  slug: string;
}
