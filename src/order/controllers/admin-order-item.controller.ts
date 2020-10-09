import { Body, Controller, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { OrderItemDto } from '../../shared/dtos/shared-dtos/order-item.dto';
import { OrderItemService } from '../order-item.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { AdminCreateOrderItemDto } from '../../shared/dtos/admin/create-order-item.dto';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { FastifyRequest } from 'fastify';
import { OrderPricesDto } from '../../shared/dtos/shared-dtos/order-prices.dto';
import { plainToClass } from 'class-transformer';
import { CustomerService } from '../../customer/customer.service';
import { AdminCalculatePricesDto } from '../../shared/dtos/admin/calculate-prices.dto';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/order-items')
export class AdminOrderItemController {

  constructor(private orderItemService: OrderItemService,
              private readonly customerService: CustomerService
  ) { }

  @Post()
  async createOrderItem(@Body() body: AdminCreateOrderItemDto): Promise<ResponseDto<OrderItemDto>> {
    const orderItem = await this.orderItemService.createOrderItem(body.sku, body.qty, false);

    return {
      data: orderItem
    };
  }

  @Post('prices')
  async calcOrderPrices(@Req() req: FastifyRequest, @Body() body: AdminCalculatePricesDto): Promise<ResponseDto<OrderPricesDto>> {
    const customer = await this.customerService.getCustomerById(body.customerId);
    const prices = await this.orderItemService.calcOrderPrices(body.items, customer);

    return {
      data: plainToClass(OrderPricesDto, prices, { excludeExtraneousValues: true })
    }
  }
}
