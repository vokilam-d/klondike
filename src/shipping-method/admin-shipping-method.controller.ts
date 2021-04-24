import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ShippingMethodService } from './shipping-method.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { AdminShippingMethodDto } from '../shared/dtos/admin/shipping-method.dto';
import { plainToClass } from 'class-transformer';
import { UserJwtGuard } from '../auth/guards/user-jwt.guard';
import { BaseShipmentDto } from '../shared/dtos/shared-dtos/base-shipment.dto';
import { AdminLang } from '../shared/decorators/lang.decorator';
import { Language } from '../shared/enums/language.enum';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/shipping-method')
export class AdminShippingMethodController {
  constructor(private readonly shippingMethodService: ShippingMethodService) {
  }

  @Get()
  async getAllShippingMethods(): Promise<ResponseDto<AdminShippingMethodDto[]>> {
    const methods = await this.shippingMethodService.getAllShippingMethods();
    return {
      data: plainToClass(AdminShippingMethodDto, methods, { excludeExtraneousValues: true })
    }
  }

  @Post()
  async createShippingMethod(@Body() methodDto: AdminShippingMethodDto): Promise<ResponseDto<AdminShippingMethodDto>> {
    const created = await this.shippingMethodService.createShippingMethod(methodDto);

    return {
      data: plainToClass(AdminShippingMethodDto, created, { excludeExtraneousValues: true })
    }
  }

  @Put(':id')
  async updateShippingMethod(
    @Param('id') id: string,
    @Body() methodDto: AdminShippingMethodDto,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminShippingMethodDto>> {
    const updated = await this.shippingMethodService.updateShippingMethod(id, methodDto, lang);

    return {
      data: plainToClass(AdminShippingMethodDto, updated, { excludeExtraneousValues: true })
    }
  }

  @Delete(':id')
  async deleteShippingMethod(
    @Param('id') id: string,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminShippingMethodDto>> {
    const deleted = await this.shippingMethodService.deleteShippingMethod(id, lang);

    return {
      data: plainToClass(AdminShippingMethodDto, deleted, { excludeExtraneousValues: true })
    }
  }
}
