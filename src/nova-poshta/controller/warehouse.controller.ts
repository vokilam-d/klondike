import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Query,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { ClientSPFDto } from '../../shared/dtos/client/spf.dto';
import { WarehouseService } from '../warehouse.service';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('warehouses')
export class WarehouseController {

  constructor(private readonly warehouseService: WarehouseService) {
  }

  @Post('action/update-catalog')
  async loadCitiesToElastic() {
    this.warehouseService.loadWarehousesToElastic();
    return 'Warehouse catalog migration has been triggered.';
  }

  @Get()
  async getFiltered(@Query() spf: ClientSPFDto): Promise<ResponseDto<any[]>> {
    return {
      data: await this.warehouseService.getWarehouses(spf)
    };
  }

}
