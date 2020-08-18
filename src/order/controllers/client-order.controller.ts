import { Body, Controller, Get, Param, Post, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { OrderService } from '../order.service';
import { FastifyRequest } from 'fastify';
import { ClientAddOrderDto, ClientOrderDto } from '../../shared/dtos/client/order.dto';
import { AuthService } from '../../auth/services/auth.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { OnlinePaymentDetailsDto } from '../../shared/dtos/client/online-payment-details.dto';
import { stripLeadingZeros } from '../../shared/helpers/strip-leading-zeros.function';
import { PaymentTypeEnum } from '../../shared/enums/payment-type.enum';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('order')
export class ClientOrderController {

  constructor(private readonly orderService: OrderService,
              private readonly authService: AuthService) {
  }

  @Get(':id/payment')
  async getPaymentDetails(@Param('id') clientOrderId: string): Promise<ResponseDto<OnlinePaymentDetailsDto>> {
    const orderId = parseInt(stripLeadingZeros(clientOrderId));
    const details = await this.orderService.getPaymentDetails(orderId);

    return {
      data: details
    }
  }

  @Post()
  async createOrder(@Req() req: FastifyRequest, @Body() addOrderDto: ClientAddOrderDto): Promise<ResponseDto<ClientOrderDto>> {
    const customer = await this.authService.getCustomerFromReq(req);
    const order = await this.orderService.createOrderClient(addOrderDto, customer);
    const orderDto = plainToClass(ClientOrderDto, order, { excludeExtraneousValues: true });
    orderDto.isOnlinePayment = order.paymentType === PaymentTypeEnum.ONLINE_PAYMENT;

    return {
      data: orderDto
    };
  }
}
