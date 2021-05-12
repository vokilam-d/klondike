import { Body, Controller, Get, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { MaintenanceInfoDto } from '../shared/dtos/shared-dtos/maintenance-info.dto';
import { MaintenanceService } from './maintenance.service';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('maintenance')
export class MaintenanceController {

  constructor(private readonly maintenanceService: MaintenanceService) { }

  @Get()
  async getMaintenanceInfo(): Promise<ResponseDto<MaintenanceInfoDto>> {
    return {
      data: this.maintenanceService.getMaintenanceInfo()
    };
  }

  @Post()
  async setMaintenanceInfo(@Body() maintenanceInfo: MaintenanceInfoDto): Promise<ResponseDto<null>> {
    await this.maintenanceService.setMaintenanceInfo(maintenanceInfo);

    return {
      data: null
    };
  }
}
