import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { AdminOrderItemDto } from '../shared/dtos/admin/order-item.dto';
import { OrderItemService } from './order-item.service';
import { ResponseDto } from '../shared/dtos/admin/response.dto';
import { classToPlain, plainToClass } from 'class-transformer';
import { CreateOrderItemDto } from '../shared/dtos/admin/create-order-item.dto';


@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/order-items')
export class AdminOrderItemController {
  constructor(private orderItemService: OrderItemService) {
  }

  @Post()
  async createOrderItem(@Body() body: CreateOrderItemDto): Promise<ResponseDto<AdminOrderItemDto>> {
    const orderItem = await this.orderItemService.createOrderItem(body.sku, body.qty, body.customerId);

    return {
      data: orderItem
    };
  }
}
