import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { OrderService } from '../order.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { AdminAddOrUpdateOrderDto, AdminOrderDto, UpdateOrderAdminNote } from '../../shared/dtos/admin/order.dto';
import { OrderActionDto } from '../../shared/dtos/admin/order-action.dto';
import { OrderActionEnum } from '../../shared/enums/order-action.enum';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';
import { OrderFilterDto } from '../../shared/dtos/admin/order-filter.dto';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { ShipmentDto } from '../../shared/dtos/admin/shipment.dto';
import { ChangeOrderStatusDto } from '../../shared/dtos/admin/change-order-status.dto';
import { AuthService } from '../../auth/services/auth.service';
import { AdminLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/orders')
export class AdminOrderController {

  constructor(private readonly orderService: OrderService,
              private readonly authService: AuthService
  ) { }

  @Get()
  async getOrdersList(@Query() spf: OrderFilterDto): Promise<ResponseDto<AdminOrderDto[]>> {
    return this.orderService.getOrdersList(spf);
  }

  @Get(':id')
  async getOrder(@Param('id') id: string): Promise<ResponseDto<AdminOrderDto>> {
    const order = await this.orderService.getOrderById(parseInt(id));

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Get(':id/order-pdf')
  async printOrder(@Param('id') id: string, @Res() reply: FastifyReply<ServerResponse>) {
    const { fileName, pdf } = await this.orderService.printOrder(parseInt(id));

    reply
      .type('application/pdf')
      .header('Content-Disposition', `attachment;filename=${encodeURIComponent(fileName)}`)
      .send(pdf);
  }

  @Get(':id/invoice-pdf')
  async printInvoice(@Param('id') id: string, @Res() reply: FastifyReply<ServerResponse>) {
    const { fileName, pdf } = await this.orderService.printInvoice(parseInt(id));

    reply
      .type('application/pdf')
      .header('Content-Disposition', `attachment;filename=${encodeURIComponent(fileName)}`)
      .send(pdf);
  }

  @Post()
  async addOrder(
    @Body() orderDto: AdminAddOrUpdateOrderDto,
    @Req() req: FastifyRequest,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminOrderDto>> {
    const user = await this.authService.getUserFromReq(req);
    const created = await this.orderService.createOrderAdmin(orderDto, lang, user);

    return {
      data: plainToClass(AdminOrderDto, created, { excludeExtraneousValues: true })
    };
  }

  @Post(':id/actions/:actionName')
  async performAction(@Param() params: OrderActionDto): Promise<ResponseDto<AdminOrderDto>> {
    let order: AdminOrderDto;

    switch (params.actionName) {
      case OrderActionEnum.UPDATE_SHIPMENT_STATUS:
        order = await this.orderService.updateShipmentStatus(params.id);
        break;
    }

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Post(':id/internet-document')
  async createInternetDocument(@Param('id') orderId: string, @Body() shipmentDto: ShipmentDto): Promise<ResponseDto<AdminOrderDto>> {
    const order = await this.orderService.createInternetDocument(parseInt(orderId), shipmentDto);

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Put(':id')
  async editOrder(@Param('id') orderId: string, @Body() orderDto: AdminAddOrUpdateOrderDto): Promise<ResponseDto<AdminOrderDto>> {
    const updated = await this.orderService.editOrder(parseInt(orderId), orderDto);

    return {
      data: plainToClass(AdminOrderDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Put(':id/status/:status')
  async changeStatus(@Param() params: ChangeOrderStatusDto): Promise<ResponseDto<AdminOrderDto>> {

    const order = await this.orderService.changeStatus(params.id, params.status);

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Put(':id/is-paid/:isPaid')
  async changePaymentStatus(@Param('id') id: number, @Param('isPaid') isPaid: boolean): Promise<ResponseDto<AdminOrderDto>> {

    const order = await this.orderService.changeOrderPaymentStatus(id, isPaid);

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Put(':id/note')
  async changeAdminNote(@Param('id') id: number, @Body() noteDto: UpdateOrderAdminNote): Promise<ResponseDto<AdminOrderDto>> {

    const order = await this.orderService.updateOrderAdminNote(id, noteDto.adminNote);

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Patch(':id/shipment')
  async editOrderShipment(@Param('id') orderId: number,
                          @Body() shipmentDto: ShipmentDto): Promise<ResponseDto<AdminOrderDto>> {

    const updated = await this.orderService.updateOrderShipment(orderId, shipmentDto);

    return {
      data: plainToClass(AdminOrderDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Delete(':id')
  async deleteOrder(@Param('id') orderId: number) {
    const deleted = await this.orderService.deleteOrder(orderId);

    return {
      data: plainToClass(AdminOrderDto, deleted, { excludeExtraneousValues: true })
    };
  }
}
