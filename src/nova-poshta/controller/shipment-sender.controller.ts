import { Controller, Get, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { ClientSPFDto } from '../../shared/dtos/client/spf.dto';
import { ShipmentSenderService } from '../shipment-sender.service';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { ShipmentSenderDto } from '../../shared/dtos/admin/shipment-sender.dto';
import { plainToClass } from 'class-transformer';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('shipment-senders')
export class ShipmentSenderController {

  constructor(private readonly shipmentSenderService: ShipmentSenderService) {
  }

  @Get()
  async getFiltered(@Query() spf: ClientSPFDto): Promise<ResponseDto<ShipmentSenderDto[]>> {
    const senders = await this.shipmentSenderService.getAll();

    return {
      data: plainToClass(ShipmentSenderDto, senders, { excludeExtraneousValues: true })
    };
  }

}
