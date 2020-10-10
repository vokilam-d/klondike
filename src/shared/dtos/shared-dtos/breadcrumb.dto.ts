import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';

export class BreadcrumbDto {
  @Expose()
  @IsNumber()
  id: number;

  @Expose()
  @IsString()
  @TrimString()
  name: string;

  @Expose()
  @IsString()
  @TrimString()
  slug: string;
}
