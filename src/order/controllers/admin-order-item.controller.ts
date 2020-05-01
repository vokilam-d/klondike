import { Body, Controller, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { OrderItemDto } from '../../shared/dtos/shared-dtos/order-item.dto';
import { OrderItemService } from '../order-item.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { AdminCreateOrderItemDto } from '../../shared/dtos/admin/create-order-item.dto';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/order-items')
export class AdminOrderItemController {

  constructor(private orderItemService: OrderItemService) {
  }

  @Post()
  async createOrderItem(@Body() body: AdminCreateOrderItemDto, @Query('migrate') migrate: any): Promise<ResponseDto<OrderItemDto>> {
    const orderItem = await this.orderItemService.createOrderItem(body.sku, body.qty, body.customerId, migrate);

    return {
      data: orderItem
    };
  }
}
