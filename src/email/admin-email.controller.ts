import { BadRequestException, Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { OrderService } from '../order/order.service';
import { UserJwtGuard } from '../auth/services/guards/user-jwt.guard';
import { ModuleRef } from '@nestjs/core';
import { __ } from '../shared/helpers/translate/translate.function';

@UseGuards(UserJwtGuard)
@Controller('admin/email-test')
export class AdminEmailController {

  private testFirstName = 'Тарас';
  private testLastName = 'Шевченко';

  constructor(private readonly emailService: EmailService,
              private readonly moduleRef: ModuleRef) {
  }

  @Post('order-confirmation/:orderId')
  async sendTestOrderConfirmEmail(@Param('orderId') orderId: number, @Body() body: any) {
    if (!body.email) {
      throw new BadRequestException(__('No "email" in payload', 'ru'));
    }

    const orderService = this.moduleRef.get(OrderService, { strict: false });
    const order = await orderService.getOrderById(parseInt(orderId as any));
    order.customerEmail = body.email;

    return this.emailService.sendOrderConfirmationEmail(order);
  }

  @Post('leave-review/:orderId')
  async sendTestLeaveReviewEmail(@Param('orderId') orderId: number, @Body() body: any) {
    if (!body.email) {
      throw new BadRequestException(__('No "email" in payload', 'ru'));
    }

    const orderService = this.moduleRef.get(OrderService, { strict: false });
    const order = await orderService.getOrderById(parseInt(orderId as any));
    order.customerEmail = body.email;

    return this.emailService.sendLeaveReviewEmail(order);
  }

  @Post('email-confirmation')
  async sendEmailConfirmationEmail(@Param('orderId') orderId: number, @Body() body: any) {
    if (!body.email) {
      throw new BadRequestException(__('No "email" in payload', 'ru'));
    }

    const customer: any = {
      email: body.email,
      firstName: this.testFirstName,
      lastName: this.testLastName
    };

    return this.emailService.sendEmailConfirmationEmail(customer, 'token');
  }

  @Post('registration-success')
  async sendRegisterSuccessEmail(@Param('orderId') orderId: number, @Body() body: any) {
    if (!body.email) {
      throw new BadRequestException(__('No "email" in payload', 'ru'));
    }

    const customer: any = {
      email: body.email,
      firstName: this.testFirstName,
      lastName: this.testLastName
    };

    return this.emailService.sendRegisterSuccessEmail(customer, 'token');
  }
}
