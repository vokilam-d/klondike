import { Body, Controller, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { OrderItemService } from '../order-item.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { CreateOrderItemDto } from '../../shared/dtos/shared-dtos/create-order-item.dto';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { FastifyRequest } from 'fastify';
import { plainToClass } from 'class-transformer';
import { CustomerService } from '../../customer/customer.service';
import { AdminCalculatePricesDto } from '../../shared/dtos/admin/calculate-prices.dto';
import { Customer } from '../../customer/models/customer.model';
import { AdminOrderItemDto } from '../../shared/dtos/admin/order-item.dto';
import { AdminOrderPricesDto } from '../../shared/dtos/admin/order-prices.dto';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/order-items')
export class AdminOrderItemController {

  constructor(
    private orderItemService: OrderItemService,
    private readonly customerService: CustomerService
  ) { }

  @Post()
  async createOrderItem(@Body() body: CreateOrderItemDto): Promise<ResponseDto<AdminOrderItemDto>> {
    const orderItem = await this.orderItemService.createOrderItem(body.sku, body.qty, body.additionalServiceIds, false, body.omitReserved);

    return {
      data: orderItem
    };
  }

  @Post('prices')
  async calcOrderPrices(@Req() req: FastifyRequest, @Body() body: AdminCalculatePricesDto): Promise<ResponseDto<AdminOrderPricesDto>> {
    let customer: Customer;
    if (body.customerId) {
      customer = await this.customerService.getCustomerById(body.customerId);
    }

    const prices = await this.orderItemService.calcOrderPrices(body.items, customer);

    return {
      data: plainToClass(AdminOrderPricesDto, prices, { excludeExtraneousValues: true })
    }
  }
}
