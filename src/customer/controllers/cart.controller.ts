import { Body, Controller, Delete, Param, Post, Put, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { AuthService } from '../../auth/services/auth.service';
import { CustomerService } from '../customer.service';
import { OrderItemService } from '../../order/services/order-item.service';
import { ClientCalculatePricesDto } from '../../shared/dtos/client/calculate-prices.dto';
import { CreateOrderItemDto } from '../../shared/dtos/shared-dtos/create-order-item.dto';
import { ClientOrderItemDto } from '../../shared/dtos/client/order-item.dto';
import { ClientOrderPricesDto } from '../../shared/dtos/client/order-prices.dto';
import { ClientLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('cart')
export class CartController {

  constructor(private readonly authService: AuthService,
              private readonly orderItemService: OrderItemService,
              private readonly customerService: CustomerService
  ) { }

  @Put()
  async createOrderItem(
    @Req() req: FastifyRequest,
    @Body() body: CreateOrderItemDto,
    @ClientLang() lang: Language
  ): Promise<ResponseDto<ClientOrderItemDto>> {
    const orderItem = await this.orderItemService.createOrderItem({ ...body, omitReserved: false }, lang, true);

    const customer = await this.authService.getCustomerFromReq(req, lang);
    if (customer) {
      this.customerService.upsertToCart(customer, orderItem).then();
    }

    return {
      data: ClientOrderItemDto.transformToDto(orderItem, lang)
    };
  }

  @Post('prices')
  async calcOrderPrices(
    @Req() req: FastifyRequest,
    @Body() body: ClientCalculatePricesDto,
    @ClientLang() lang: Language
  ): Promise<ResponseDto<ClientOrderPricesDto>> {
    const customer = await this.authService.getCustomerFromReq(req, lang);
    const prices = await this.orderItemService.calcOrderPrices(body.items, customer, lang);

    return {
      data: ClientOrderPricesDto.transformToDto(prices, lang)
    }
  }

  @Delete(':sku')
  async deleteOrderItem(
    @Req() req: FastifyRequest,
    @Param('sku') sku: string,
    @ClientLang() lang: Language
  ): Promise<ResponseDto<boolean>> {
    const customer = await this.authService.getCustomerFromReq(req, lang);
    if (customer) {
      await this.customerService.deleteFromCart(customer, sku);
    }

    return {
      data: true
    };
  }
}
