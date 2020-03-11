import { IsBoolean, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { MediaDto } from '../shared/media.dto';

export class AdminMediaDto extends MediaDto {
  @Expose()
  @IsBoolean()
  isHidden?: boolean;

  @Expose()
  @IsString()
  size?: string;

  @Expose()
  @IsString()
  dimensions?: string;
}
