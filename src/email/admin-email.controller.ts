import { BadRequestException, Body, Controller, Param, Post } from '@nestjs/common';
import { EmailService } from './email.service';
import { OrderService } from '../order/order.service';

@Controller('admin/email-test')
export class AdminEmailController {

  private testFirstName = 'Тарас';
  private testLastName = 'Шевченко';

  constructor(private readonly emailService: EmailService,
              private readonly orderService: OrderService) {
  }

  @Post('order-confirmation/:orderId')
  async sendTestOrderConfirmEmail(@Param('orderId') orderId: number, @Body() body: any) {
    if (!body.email) {
      throw new BadRequestException(`No 'email' in payload`);
    }

    const order = await this.orderService.getOrderById(parseInt(orderId as any));
    order.customerFirstName = this.testFirstName;
    order.customerLastName = this.testLastName;
    order.customerEmail = body.email;

    return this.emailService.sendOrderConfirmationEmail(order);
  }

  @Post('email-confirmation')
  async sendRegisterConfirmEmail(@Param('orderId') orderId: number, @Body() body: any) {
    if (!body.email) {
      throw new BadRequestException(`No 'email' in payload`);
    }

    return this.emailService.sendRegisterConfirmEmail(body.email, 'customer/account/login');
  }

  @Post('registration-success')
  async sendRegisterSuccessEmail(@Param('orderId') orderId: number, @Body() body: any) {
    if (!body.email) {
      throw new BadRequestException(`No 'email' in payload`);
    }

    return this.emailService.sendRegisterSuccessEmail(body.email, this.testFirstName, this.testLastName);
  }
}
