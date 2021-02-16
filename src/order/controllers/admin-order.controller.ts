import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Request, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { AdminAddOrUpdateOrderDto, AdminOrderDto, UpdateOrderAdminNote, UpdateOrderManager } from '../../shared/dtos/admin/order.dto';
import { OrderActionDto } from '../../shared/dtos/admin/order-action.dto';
import { OrderActionEnum } from '../../shared/enums/order-action.enum';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';
import { OrderFilterDto } from '../../shared/dtos/admin/order-filter.dto';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { ShipmentDto } from '../../shared/dtos/admin/shipment.dto';
import { ChangeOrderStatusDto } from '../../shared/dtos/admin/change-order-status.dto';
import { AdminLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';
import { InvoiceEditDto } from '../../shared/dtos/admin/invoice-edit.dto';
import { PackOrderItemDto } from '../../shared/dtos/admin/pack-order-item.dto';
import { ValidatedUser } from '../../shared/decorators/validated-user.decorator';
import { User } from '../../user/models/user.model';
import { DocumentType } from '@typegoose/typegoose';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/orders')
export class AdminOrderController {

  constructor(
    private readonly orderService: OrderService
  ) { }

  @Get()
  async getOrdersList(@Query() spf: OrderFilterDto): Promise<ResponseDto<AdminOrderDto[]>> {
    return this.orderService.getOrdersList(spf);
  }

  @Get(':id')
  async getOrder(@Param('id') id: string, @AdminLang() lang: Language): Promise<ResponseDto<AdminOrderDto>> {
    const order = await this.orderService.getOrderById(parseInt(id), lang);

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Get(':id/order-pdf')
  async printOrder(
    @Param('id') id: string,
    @Res() reply: FastifyReply<ServerResponse>,
    @AdminLang() lang: Language
  ) {
    const { fileName, pdf } = await this.orderService.printOrder(parseInt(id), lang);

    reply
      .type('application/pdf')
      .header('Content-Disposition', `attachment;filename=${encodeURIComponent(fileName)}`)
      .send(pdf);
  }

  @Get(':id/invoice-pdf')
  async printInvoice(
    @Param('id') id: string,
    @Query() editDto: InvoiceEditDto,
    @Res() reply: FastifyReply<ServerResponse>,
    @AdminLang() lang: Language
  ) {
    const { fileName, pdf } = await this.orderService.printInvoice(parseInt(id), editDto, lang);

    reply
      .type('application/pdf')
      .header('Content-Disposition', `attachment;filename=${encodeURIComponent(fileName)}`)
      .send(pdf);
  }

  @Post()
  async addOrder(
    @Body() orderDto: AdminAddOrUpdateOrderDto,
    @ValidatedUser() user: DocumentType<User>,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminOrderDto>> {
    const created = await this.orderService.createOrderAdmin(orderDto, lang, user);

    return {
      data: plainToClass(AdminOrderDto, created, { excludeExtraneousValues: true })
    };
  }

  @Post(':id/actions/:actionName')
  async performAction(
    @Param() params: OrderActionDto,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminOrderDto>> {
    let order: AdminOrderDto;

    switch (params.actionName) {
      case OrderActionEnum.UPDATE_SHIPMENT_STATUS:
        order = await this.orderService.updateShipmentStatus(params.id, lang);
        break;
    }

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Post(':id/internet-document')
  async createInternetDocument(
    @Param('id') orderId: string,
    @Body() shipmentDto: ShipmentDto,
    @ValidatedUser() user: DocumentType<User>,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminOrderDto>> {
    const order = await this.orderService.createInternetDocument(parseInt(orderId), shipmentDto, user, lang);

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Post(':id/media')
  async uploadMedia(
    @Param('id') orderId: string,
    @Request() request: FastifyRequest,
    @ValidatedUser() user: DocumentType<User>,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminOrderDto>> {
    const order = await this.orderService.uploadMedia(request, parseInt(orderId), user, lang);

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Put(':id')
  async editOrder(
    @Param('id') orderId: string,
    @Body() orderDto: AdminAddOrUpdateOrderDto,
    @ValidatedUser() user: DocumentType<User>,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminOrderDto>> {
    const updated = await this.orderService.editOrder(parseInt(orderId), orderDto, user, lang);

    return {
      data: plainToClass(AdminOrderDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Put(':id/status/:status')
  async changeStatus(
    @Param() params: ChangeOrderStatusDto,
    @ValidatedUser() user: DocumentType<User>,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminOrderDto>> {

    const order = await this.orderService.changeStatus(params.id, params.status, user, lang);

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Put(':id/is-paid/:isPaid')
  async changePaymentStatus(
    @Param('id') id: number,
    @Param('isPaid') isPaid: boolean,
    @ValidatedUser() user: DocumentType<User>,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminOrderDto>> {

    const order = await this.orderService.changeOrderPaymentStatus(id, isPaid, user, lang);

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Put(':id/note')
  async changeAdminNote(
    @Param('id') id: number,
    @Body() noteDto: UpdateOrderAdminNote,
    @ValidatedUser() user: DocumentType<User>,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminOrderDto>> {

    const order = await this.orderService.updateOrderAdminNote(id, noteDto.adminNote, user, lang);

    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Put(':id/manager')
  async changeAdminManager(
    @Param('id') id: number,
    @Body() managerDto: UpdateOrderManager,
    @ValidatedUser() user: DocumentType<User>,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminOrderDto>> {

    const order = await this.orderService.updateOrderManager(id, managerDto.userId, user, lang);
    return {
      data: plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true })
    };
  }

  @Put(':id/is-packed')
  async packOrderItem(
    @Param('id') orderId: number,
    @Body() packOrderItemDto: PackOrderItemDto,
    @ValidatedUser() user: DocumentType<User>,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminOrderDto>> {

    const updated = await this.orderService.packOrderItem(orderId, packOrderItemDto, user, lang);

    return {
      data: plainToClass(AdminOrderDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Patch(':id/shipment')
  async editOrderShipment(
    @Param('id') orderId: number,
    @Body() shipmentDto: ShipmentDto,
    @ValidatedUser() user: DocumentType<User>,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminOrderDto>> {

    const updated = await this.orderService.updateOrderShipment(orderId, shipmentDto, user, lang);

    return {
      data: plainToClass(AdminOrderDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Delete(':id')
  async deleteOrder(
    @Param('id') orderId: number,
    @ValidatedUser() user: DocumentType<User>,
    @AdminLang() lang: Language
  ) {
    const deleted = await this.orderService.deleteOrder(orderId, user, lang);

    return {
      data: plainToClass(AdminOrderDto, deleted, { excludeExtraneousValues: true })
    };
  }
}
