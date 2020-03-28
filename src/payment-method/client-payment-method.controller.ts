import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { PaymentMethodService } from './payment-method.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { ClientPaymentMethodDto } from '../shared/dtos/client/payment-method.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('payment-method')
export class ClientPaymentMethodController {

  constructor(private readonly paymentMethodService: PaymentMethodService) {
  }

  @Get()
  async getAllPaymentMethods(): Promise<ResponseDto<ClientPaymentMethodDto[]>> {
    const methods = await this.paymentMethodService.getAllPaymentMethods();

    return {
      data: plainToClass(ClientPaymentMethodDto, methods, { excludeExtraneousValues: true })
    }
  }
}
