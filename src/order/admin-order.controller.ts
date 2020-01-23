import { Body, Controller, Get, Param, Patch, Post, Put, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { AdminSortingPaginatingDto } from '../shared/dtos/admin/filter.dto';
import { ResponseDto, ResponsePaginationDto } from '../shared/dtos/admin/response.dto';
import { plainToClass } from 'class-transformer';
import { AdminAddOrUpdateOrderDto, AdminOrderDto } from '../shared/dtos/admin/order.dto';
import { OrderActionDto } from '../shared/dtos/admin/order-action.dto';
import { EOrderAction } from '../shared/enums/order-action.enum';
import { AdminShippingAddressDto } from '../shared/dtos/admin/customer.dto';


class ShippingAddressDto {
}

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/orders')
export class AdminOrderController {

  constructor(private orderService: OrderService) {
  }

  @Get()
  async getAllOrders(@Query() sortingPaging: AdminSortingPaginatingDto): Promise<ResponsePaginationDto<AdminOrderDto[]>> {
    const [ results, itemsTotal ] = await Promise.all([this.orderService.getAllOrders(sortingPaging), this.orderService.countOrders()]);
    const pagesTotal = Math.ceil(itemsTotal / sortingPaging.limit);

    return {
      data: plainToClass(AdminOrderDto, results, { excludeExtraneousValues: true }),
      page: sortingPaging.page,
      pagesTotal,
      itemsTotal
    };
  }

  @Get(':id')
  async getOrder(@Param('id') id: string): Promise<ResponseDto<AdminOrderDto>> {
    const order = await this.orderService.getOrderById(parseInt(id));

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Post()
  async addOrder(@Body() orderDto: AdminAddOrUpdateOrderDto): Promise<ResponseDto<AdminOrderDto>> {
    const created = await this.orderService.createOrder(orderDto);

    return {
      data: plainToClass(AdminOrderDto, created, { excludeExtraneousValues: true })
    };
  }

  @Put(':id')
  async editOrder(@Param('id') orderId: number, @Body() orderDto: AdminAddOrUpdateOrderDto): Promise<ResponseDto<AdminOrderDto>> {
    const updated = await this.orderService.editOrder(orderId, orderDto);

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
