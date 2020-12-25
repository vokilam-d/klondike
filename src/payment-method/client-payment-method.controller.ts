import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { PaymentMethodService } from './payment-method.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { ClientPaymentMethodDto } from '../shared/dtos/client/payment-method.dto';
import { ClientLang } from '../shared/decorators/lang.decorator';
import { Language } from '../shared/enums/language.enum';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('payment-method')
export class ClientPaymentMethodController {

  constructor(private readonly paymentMethodService: PaymentMethodService) {
  }

  @Get()
  async getAllPaymentMethods(@ClientLang() lang: Language): Promise<ResponseDto<ClientPaymentMethodDto[]>> {
    const methods = await this.paymentMethodService.getEnabledSortedPaymentMethods();

    return {
      data: methods.map(method => ClientPaymentMethodDto.transformToDto(method, lang))
    }
  }
}
