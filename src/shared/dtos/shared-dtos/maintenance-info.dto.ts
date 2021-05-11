import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class MaintenanceInfoDto {
  @Expose()
  @IsBoolean()
  isMaintenanceInProgress: boolean;

  @Expose()
  @IsOptional()
  @IsString()
  maintenanceEndTime: string | null;
}
