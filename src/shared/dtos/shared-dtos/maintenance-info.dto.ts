import { Expose } from 'class-transformer';

export class MaintenanceInfoDto {
  @Expose()
  isMaintenanceInProgress: boolean;

  @Expose()
  maintenanceEndTime: string;
}
