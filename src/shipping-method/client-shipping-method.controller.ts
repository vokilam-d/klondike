import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { ShippingMethodService } from './shipping-method.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { ClientShippingMethodDto } from '../shared/dtos/client/shipping-method.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('shipping-method')
export class ClientShippingMethodController {

  constructor(private readonly shippingMethodService: ShippingMethodService) {
  }

  @Get()
  async getAllShippingMethods(): Promise<ResponseDto<ClientShippingMethodDto[]>> {
    const methods = await this.shippingMethodService.getAllShippingMethods();
    return {
      data: plainToClass(ClientShippingMethodDto, methods, { excludeExtraneousValues: true })
    }
  }
}
