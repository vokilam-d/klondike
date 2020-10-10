import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { MediaDto } from '../shared-dtos/media.dto';
import { TrimString } from '../../decorators/trim-string.decorator';

export class AdminMediaDto extends MediaDto {
  @Expose()
  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  size?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  dimensions?: string;
}
