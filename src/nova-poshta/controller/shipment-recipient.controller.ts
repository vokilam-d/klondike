import { ClassSerializerInterceptor, Controller, Get, Query, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { ClientSPFDto } from '../../shared/dtos/client/spf.dto';
import { NovaPoshtaService } from '../nova-poshta.service';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('shipment-recipients')
export class ShipmentRecipientController {

  constructor(private readonly novaPoshtaService: NovaPoshtaService) {
  }

  @Get()
  async getFiltered(@Query() spf: ClientSPFDto): Promise<ResponseDto<any>> {
    return {
      data: await this.novaPoshtaService.shipmentRecipient(spf)
    };
  }

}
