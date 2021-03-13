import { Body, Controller, Param, Post, Query, Req, Request, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { OrderItemService } from '../services/order-item.service';
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
import { AdminLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';
import { OrderService } from '../services/order.service';
import { AdminOrderDto } from '../../shared/dtos/admin/order.dto';
import { AuthService } from '../../auth/services/auth.service';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/order-media')
export class AdminOrderMediaController {

  constructor(
    private readonly orderService: OrderService,
    private readonly authService: AuthService
  ) { }

  @Post(':id')
  async uploadMedia(
    @Param('id') orderId: string,
    @Query('login') loginParam: string,
    @Request() request: FastifyRequest,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminOrderDto>> {
    const user = await this.authService.getUserFromReq(request);
    const login: string = user?.login || loginParam || 'UNKNOWN_USER';

    const order = await this.orderService.uploadMedia(request, parseInt(orderId), login, lang);

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }
}
