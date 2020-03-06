import { Body, Controller, Get, Param, Post, Put, Query, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { ResponseDto } from '../shared/dtos/shared/response.dto';
import { plainToClass } from 'class-transformer';
import { AdminAddOrUpdateOrderDto, AdminOrderDto } from '../shared/dtos/admin/order.dto';
import { OrderActionDto } from '../shared/dtos/admin/order-action.dto';
import { EOrderAction } from '../shared/enums/order-action.enum';
import { AdminShippingAddressDto } from '../shared/dtos/admin/customer.dto';
import { FastifyReply } from 'fastify';
import { ServerResponse } from 'http';
import { OrderFilterDto } from '../shared/dtos/admin/order-filter.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/orders')
export class AdminOrderController {

  constructor(private orderService: OrderService) {
  }

  @Get()
  async getOrdersList(@Query() spf: OrderFilterDto): Promise<ResponseDto<AdminOrderDto[]>> {
    return this.orderService.getOrdersList(spf);
  }

  @Get(':id')
  async getOrder(@Param('id') id: string): Promise<ResponseDto<AdminOrderDto>> {
    const order = await this.orderService.getOrderById(parseInt(id));

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Post()
  async addOrder(@Body() orderDto: AdminAddOrUpdateOrderDto, @Query('migrate') migrate: any): Promise<ResponseDto<AdminOrderDto>> {
    const created = await this.orderService.createOrder(orderDto, migrate);

    return {
      data: plainToClass(AdminOrderDto, created, { excludeExtraneousValues: true })
    };
  }

  @Get(':id/invoice')
  async printOrder(@Param('id') id: string, @Res() reply: FastifyReply<ServerResponse>) {
    const { fileName, pdf } = await this.orderService.printOrder(parseInt(id));

    reply
      .type('application/pdf')
      .header('Content-Disposition', `attachment;filename=${encodeURIComponent(fileName)}`)
      .send(pdf);
  }

  @Put(':id')
  async editOrder(@Param('id') orderId: string, @Body() orderDto: AdminAddOrUpdateOrderDto): Promise<ResponseDto<AdminOrderDto>> {
    const updated = await this.orderService.editOrder(parseInt(orderId), orderDto);

    return {
      data: plainToClass(AdminOrderDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Put(':id/address')
  async editOrderAddress(@Param('id') orderId: number, @Body() addressDto: AdminShippingAddressDto): Promise<ResponseDto<AdminOrderDto>> {
    const updated = await this.orderService.editOrderAddress(orderId, addressDto);

    return {
      data: plainToClass(AdminOrderDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Post('counter') // todo remove this and all counter updates after migrate
  updateCounter() {
    return this.orderService.updateCounter();
  }

  @Post(':id/actions/:actionName')
  async performAction(@Param() params: OrderActionDto): Promise<ResponseDto<AdminOrderDto>> {
    let order;

    switch (params.actionName) {
      case EOrderAction.CANCEL:
        order = await this.orderService.cancelOrder(params.id);
        break;
      case EOrderAction.START:
        order = await this.orderService.startOrder(params.id);
        break;
      case EOrderAction.SHIP:
        order = await this.orderService.shipOrder(params.id);
        break;
    }

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }
}
