import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { MaintenanceInfoDto } from '../shared/dtos/shared-dtos/maintenance-info.dto';
import { EventsService } from '../shared/services/events/events.service';

@Injectable()
export class MaintenanceService implements OnApplicationBootstrap {

  private updateEventName: string = 'maintenance-update';
  private isInProgress: boolean = false;
  private endTime: Date = null;

  constructor(private readonly eventsService: EventsService) {
  }

  onApplicationBootstrap(): any {
    this.handleUpdate();
  }

  async getMaintenanceInfo(): Promise<MaintenanceInfoDto> {
    return {
      isMaintenanceInProgress: this.isInProgress,
      maintenanceEndTime: this.endTime?.toISOString()
    };
  }

  async setMaintenanceInfo(maintenanceInfo: MaintenanceInfoDto): Promise<void> {
    this.eventsService.emit(this.updateEventName, maintenanceInfo);
  }

  private handleUpdate() {
    this.eventsService.on(this.updateEventName, (maintenanceInfo: MaintenanceInfoDto) => {
      this.isInProgress = maintenanceInfo.isMaintenanceInProgress;
      this.endTime = new Date(maintenanceInfo.maintenanceEndTime);
    });
  }
}
