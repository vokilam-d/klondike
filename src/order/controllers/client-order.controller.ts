import { Body, Controller, Post, Req } from '@nestjs/common';
import { OrderService } from '../order.service';
import { FastifyRequest } from 'fastify';
import { ClientAddOrderDto, ClientOrderDto } from '../../shared/dtos/client/order.dto';
import { AuthService } from '../../auth/services/auth.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';

@Controller('order')
export class ClientOrderController {

  constructor(private readonly orderService: OrderService,
              private readonly authService: AuthService) {
  }

  @Post()
  async createOrder(@Req() req: FastifyRequest, @Body() addOrderDto: ClientAddOrderDto): Promise<ResponseDto<ClientOrderDto>> {
    const customer = await this.authService.getCustomerFromReq(req);
    const order = await this.orderService.createOrderClient(addOrderDto, customer);

    return {
      data: plainToClass(ClientOrderDto, order, { excludeExtraneousValues: true })
    };
  }
}
