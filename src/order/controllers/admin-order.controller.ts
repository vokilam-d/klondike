import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { OrderService } from '../order.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { AdminAddOrUpdateOrderDto, AdminOrderDto } from '../../shared/dtos/admin/order.dto';
import { OrderActionDto } from '../../shared/dtos/admin/order-action.dto';
import { OrderActionEnum } from '../../shared/enums/order-action.enum';
import { FastifyReply } from 'fastify';
import { ServerResponse } from 'http';
import { OrderFilterDto } from '../../shared/dtos/admin/order-filter.dto';
import { ShippingAddressDto } from '../../shared/dtos/shared-dtos/shipping-address.dto';
import { UserJwtGuard } from '../../auth/services/guards/user-jwt.guard';
import { ShipmentDto } from '../../shared/dtos/admin/shipment.dto';
import { OrderShipmentService } from '../order-shipment.service';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/orders')
export class AdminOrderController {

  constructor(private orderService: OrderService, private orderShipmentService: OrderShipmentService) {
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
    const created = await this.orderService.createOrderAdmin(orderDto, migrate);

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
  async editOrderAddress(@Param('id') orderId: number, @Body() addressDto: ShippingAddressDto): Promise<ResponseDto<AdminOrderDto>> {
    const updated = await this.orderService.editOrderAddress(orderId, addressDto);

    return {
      data: plainToClass(AdminOrderDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Put(':id/shipment')
  async editOrderShipment(@Param('id') orderId: number,
                          @Body() shipmentDto: ShipmentDto): Promise<ResponseDto<AdminOrderDto>> {
    const updated = await this.orderShipmentService.editOrderShipment(orderId, shipmentDto);

    return {
      data: plainToClass(AdminOrderDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Get('/latest-shipment-statuses')
  async fetchShipmentStatuses(): Promise<ResponseDto<AdminOrderDto[]>> {
    const updated = await this.orderShipmentService.getOrdersWithLatestShipmentStatuses();

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
      case OrderActionEnum.CANCEL:
        order = await this.orderService.cancelOrder(params.id);
        break;
      case OrderActionEnum.START:
        order = await this.orderService.startOrder(params.id);
        break;
      case OrderActionEnum.SHIP:
        order = await this.orderService.shipOrder(params.id);
        break;
    }

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }
}
