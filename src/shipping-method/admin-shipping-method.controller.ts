import { Body, Controller, Delete, Get, Param, Post, Put, UsePipes, ValidationPipe } from '@nestjs/common';
import { ShippingMethodService } from './shipping-method.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { AdminShippingMethodDto } from '../shared/dtos/admin/shipping-method.dto';
import { plainToClass } from 'class-transformer';

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
  async updateShippingMethod(@Param('id') id: string, @Body() methodDto: AdminShippingMethodDto): Promise<ResponseDto<AdminShippingMethodDto>> {
    const updated = await this.shippingMethodService.updateShippingMethod(id, methodDto);

    return {
      data: plainToClass(AdminShippingMethodDto, updated, { excludeExtraneousValues: true })
    }
  }

  @Delete(':id')
  async deleteShippingMethod(@Param('id') id: string): Promise<ResponseDto<AdminShippingMethodDto>> {
    const deleted = await this.shippingMethodService.deleteShippingMethod(id);

    return {
      data: plainToClass(AdminShippingMethodDto, deleted, { excludeExtraneousValues: true })
    }
  }
}
