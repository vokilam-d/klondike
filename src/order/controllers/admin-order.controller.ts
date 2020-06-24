import { Body, Controller, Get, Param, Patch, Post, Put, Query, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { OrderService } from '../order.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { AdminAddOrUpdateOrderDto, AdminOrderDto } from '../../shared/dtos/admin/order.dto';
import { OrderActionDto } from '../../shared/dtos/admin/order-action.dto';
import { OrderActionEnum } from '../../shared/enums/order-action.enum';
import { FastifyReply } from 'fastify';
import { ServerResponse } from 'http';
import { OrderFilterDto } from '../../shared/dtos/admin/order-filter.dto';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { ShipmentDto } from '../../shared/dtos/admin/shipment.dto';
import { ChangeOrderStatusDto } from '../../shared/dtos/admin/change-order-status.dto';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/orders')
export class AdminOrderController {

  constructor(private orderService: OrderService) {
  }

  @Get()
  async getOrdersList(@Query() spf: OrderFilterDto): Promise<ResponseDto<AdminOrderDto[]>> {
    return this.orderService.getOrdersList(spf);
  }

  @Get('/latest-shipment-statuses')
  async fetchShipmentStatuses(): Promise<ResponseDto<AdminOrderDto[]>> {
    const updated = await this.orderService.getOrdersWithLatestShipmentStatuses();

    return {
      data: plainToClass(AdminOrderDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Get(':id')
  async getOrder(@Param('id') id: string): Promise<ResponseDto<AdminOrderDto>> {
    const order = await this.orderService.getOrderById(parseInt(id));

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
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

  @Post()
  async addOrder(@Body() orderDto: AdminAddOrUpdateOrderDto, @Query('migrate') migrate: any): Promise<ResponseDto<AdminOrderDto>> {
    const created = await this.orderService.createOrderAdmin(orderDto, migrate);

    return {
      data: plainToClass(AdminOrderDto, created, { excludeExtraneousValues: true })
    };
  }

  @Post('counter') // todo remove this and all counter updates after migrate
  updateCounter() {
    return this.orderService.updateCounter();
  }

  @Post('clear-collection') // todo remove this and all counter updates
  clearCollection() {
    return this.orderService.clearCollection();
  }

  @Post(':id/actions/:actionName')
  async performAction(@Param() params: OrderActionDto): Promise<ResponseDto<AdminOrderDto>> {
    let order: AdminOrderDto;

    switch (params.actionName) {
      case OrderActionEnum.UPDATE_SHIPMENT_STATUS:
        order = await this.orderService.updateShipmentStatus(params.id);
        break;
    }

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Put(':id')
  async editOrder(@Param('id') orderId: string, @Body() orderDto: AdminAddOrUpdateOrderDto): Promise<ResponseDto<AdminOrderDto>> {
    const updated = await this.orderService.editOrder(parseInt(orderId), orderDto);

    return {
      data: plainToClass(AdminOrderDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Put(':id/status/:status')
  async changeStatus(@Param() params: ChangeOrderStatusDto,
                     @Body() shipmentDto?: ShipmentDto): Promise<ResponseDto<AdminOrderDto>> {

    const order = await this.orderService.changeStatus(params.id, params.status, shipmentDto);

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Put(':id/is-paid/:isPaid')
  async changePaymentStatus(@Param('id') id: number, @Param('isPaid') isPaid: boolean): Promise<ResponseDto<AdminOrderDto>> {

    const order = await this.orderService.changeOrderPaymentStatus(id, isPaid);

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Patch(':id/shipment')
  async editOrderShipment(@Param('id') orderId: number,
                          @Body() shipmentDto: ShipmentDto): Promise<ResponseDto<AdminOrderDto>> {

    const updated = await this.orderService.updateOrderShipment(orderId, shipmentDto);

    return {
      data: plainToClass(AdminOrderDto, updated, { excludeExtraneousValues: true })
    };
  }
}
