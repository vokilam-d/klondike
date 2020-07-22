import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { MediaDto } from '../shared-dtos/media.dto';

export class AdminMediaDto extends MediaDto {
  @Expose()
  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @Expose()
  @IsOptional()
  @IsString()
  size?: string;

  @Expose()
  @IsOptional()
  @IsString()
  dimensions?: string;
}
