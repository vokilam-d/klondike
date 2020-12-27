import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { ShippingMethodService } from './shipping-method.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { ClientShippingMethodDto } from '../shared/dtos/client/shipping-method.dto';
import { ClientLang } from '../shared/decorators/lang.decorator';
import { Language } from '../shared/enums/language.enum';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('shipping-method')
export class ClientShippingMethodController {

  constructor(private readonly shippingMethodService: ShippingMethodService) {
  }

  @Get()
  async getAllShippingMethods(@ClientLang() lang: Language): Promise<ResponseDto<ClientShippingMethodDto[]>> {
    const methods = await this.shippingMethodService.getAllShippingMethods();
    return {
      data: methods.map(method => ClientShippingMethodDto.transformToDto(method, lang))
    }
  }
}
