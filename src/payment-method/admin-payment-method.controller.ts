import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { PaymentMethodService } from './payment-method.service';
import { ResponseDto } from '../shared/dtos/admin/response.dto';
import { PaymentMethodDto } from '../shared/dtos/admin/payment-method.dto';
import { plainToClass } from 'class-transformer';


@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/payment-method')
export class AdminPaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {
  }

  @Get()
  async getAllPaymentMethods(): Promise<ResponseDto<PaymentMethodDto[]>> {
    const methods = await this.paymentMethodService.getAllPaymentMethods();

    return {
      data: plainToClass(PaymentMethodDto, methods, { excludeExtraneousValues: true })
    }
  }

  @Post()
  async createPaymentMethod(@Body() methodDto: PaymentMethodDto): Promise<ResponseDto<PaymentMethodDto>> {
    const created = await this.paymentMethodService.createPaymentMethod(methodDto);

    return {
      data: plainToClass(PaymentMethodDto, created, { excludeExtraneousValues: true })
    }
  }

  @Put(':id')
  async updatePaymentMethod(@Param('id') id: string, @Body() methodDto: PaymentMethodDto): Promise<ResponseDto<PaymentMethodDto>> {
    const updated = await this.paymentMethodService.updatePaymentMethod(id, methodDto);

    return {
      data: plainToClass(PaymentMethodDto, updated, { excludeExtraneousValues: true })
    }
  }

  @Delete(':id')
  async deletePaymentMethod(@Param('id') id: string): Promise<ResponseDto<PaymentMethodDto>> {
    const deleted = await this.paymentMethodService.deletePaymentMethod(id);

    return {
      data: plainToClass(PaymentMethodDto, deleted, { excludeExtraneousValues: true })
    }
  }
}
