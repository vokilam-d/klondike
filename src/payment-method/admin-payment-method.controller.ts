import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { PaymentMethodService } from './payment-method.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { AdminPaymentMethodDto } from '../shared/dtos/admin/payment-method.dto';
import { plainToClass } from 'class-transformer';
import { UserJwtGuard } from '../auth/guards/user-jwt.guard';
import { BaseShipmentDto } from '../shared/dtos/shared-dtos/base-shipment.dto';
import { AdminLang } from '../shared/decorators/lang.decorator';
import { Language } from '../shared/enums/language.enum';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/payment-method')
export class AdminPaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {
  }

  @Get()
  async getAllPaymentMethods(): Promise<ResponseDto<AdminPaymentMethodDto[]>> {
    const methods = await this.paymentMethodService.getAllPaymentMethods();

    return {
      data: plainToClass(AdminPaymentMethodDto, methods, { excludeExtraneousValues: true })
    }
  }

  @Post()
  async createPaymentMethod(@Body() methodDto: AdminPaymentMethodDto): Promise<ResponseDto<AdminPaymentMethodDto>> {
    const created = await this.paymentMethodService.createPaymentMethod(methodDto);

    return {
      data: plainToClass(AdminPaymentMethodDto, created, { excludeExtraneousValues: true })
    }
  }

  @Put(':id')
  async updatePaymentMethod(
    @Param('id') id: string,
    @Body() methodDto: AdminPaymentMethodDto,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminPaymentMethodDto>> {
    const updated = await this.paymentMethodService.updatePaymentMethod(id, methodDto, lang);

    return {
      data: plainToClass(AdminPaymentMethodDto, updated, { excludeExtraneousValues: true })
    }
  }

  @Delete(':id')
  async deletePaymentMethod(@Param('id') id: string, @AdminLang() lang: Language): Promise<ResponseDto<AdminPaymentMethodDto>> {
    const deleted = await this.paymentMethodService.deletePaymentMethod(id, lang);

    return {
      data: plainToClass(AdminPaymentMethodDto, deleted, { excludeExtraneousValues: true })
    }
  }
}
