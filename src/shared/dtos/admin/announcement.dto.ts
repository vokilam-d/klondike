import { Expose } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';


export class AdminAnnouncementDto {
  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @IsBoolean()
  isFixed: boolean;

  @Expose()
  @IsString()
  announcement: string;
}
