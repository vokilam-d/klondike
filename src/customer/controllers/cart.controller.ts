import { Body, Controller, Delete, Param, Put, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { ClientAddOrUpdateOrderItemDto } from '../../shared/dtos/client/order-item.dto';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { OrderItemDto } from '../../shared/dtos/shared-dtos/order-item.dto';
import { AuthService } from '../../auth/services/auth.service';
import { CustomerService } from '../customer.service';
import { OrderItemService } from '../../order/order-item.service';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('cart')
export class CartController {

  constructor(private readonly authService: AuthService,
              private readonly orderItemService: OrderItemService,
              private readonly customerService: CustomerService) {
  }

  @Put()
  async createOrderItem(@Req() req: FastifyRequest, @Body() body: ClientAddOrUpdateOrderItemDto): Promise<ResponseDto<OrderItemDto>> {
    const orderItem = await this.orderItemService.createOrderItem(body.sku, body.qty);

    const customer = await this.authService.getCustomerFromReq(req);
    if (customer) {
      await this.customerService.upsertToCart(customer, orderItem);
    }

    return {
      data: orderItem
    };
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
