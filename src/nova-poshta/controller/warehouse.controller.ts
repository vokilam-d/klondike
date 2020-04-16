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
import { SettlementService } from '../settlement.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { ClientSPFDto } from '../../shared/dtos/client/spf.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('warehouses')
export class WarehouseController {

  constructor(private readonly novaPoshtaService: SettlementService) {
  }

  @Post('action/update-catalog')
  async loadCitiesToElastic() {
    this.novaPoshtaService.loadCitiesToElastic();
    return 'Settlement catalog migration has been triggered.';
  }

  @Get()
  async getFiltered(@Query() spf: ClientSPFDto): Promise<ResponseDto<any[]>> {
    return {
      data: await this.novaPoshtaService.getCities(spf)
    };
  }
}
