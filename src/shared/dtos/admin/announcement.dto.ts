import { Expose } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';


export class AdminAnnouncementDto {
  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @IsString()
  announcement: string;
}
