import { Body, Controller, Delete, Param, Post, Put, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { ClientAddOrUpdateOrderItemDto } from '../../shared/dtos/client/order-item.dto';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { OrderItemDto } from '../../shared/dtos/shared-dtos/order-item.dto';
import { AuthService } from '../../auth/services/auth.service';
import { CustomerService } from '../customer.service';
import { OrderItemService } from '../../order/order-item.service';
import { OrderPricesDto } from '../../shared/dtos/shared-dtos/order-prices.dto';
import { plainToClass } from 'class-transformer';
import { ClientCalculatePricesDto } from '../../shared/dtos/client/calculate-prices.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('cart')
export class CartController {

  constructor(private readonly authService: AuthService,
              private readonly orderItemService: OrderItemService,
              private readonly customerService: CustomerService
  ) { }

  @Put()
  async createOrderItem(@Req() req: FastifyRequest, @Body() body: ClientAddOrUpdateOrderItemDto): Promise<ResponseDto<OrderItemDto>> {
    const orderItem = await this.orderItemService.createOrderItem(body.sku, body.qty, body.additionalServiceIds, true, false);

    const customer = await this.authService.getCustomerFromReq(req);
    if (customer) {
      this.customerService.upsertToCart(customer, orderItem).then();
    }

    return {
      data: orderItem
    };
  }

  @Post('prices')
  async calcOrderPrices(@Req() req: FastifyRequest, @Body() body: ClientCalculatePricesDto): Promise<ResponseDto<OrderPricesDto>> {
    const customer = await this.authService.getCustomerFromReq(req);
    const prices = await this.orderItemService.calcOrderPrices(body.items, customer);

    return {
      data: plainToClass(OrderPricesDto, prices, { excludeExtraneousValues: true })
    }
  }

  @Delete(':sku')
  async deleteOrderItem(@Req() req: FastifyRequest, @Param('sku') sku: string): Promise<ResponseDto<boolean>> {
    const customer = await this.authService.getCustomerFromReq(req);
    if (customer) {
      await this.customerService.deleteFromCart(customer, sku);
    }

    return {
      data: true
    };
  }
}
