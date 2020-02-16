import { BadRequestException, Body, Controller, Param, Post } from '@nestjs/common';
import { EmailService } from './email.service';
import { OrderService } from '../order/order.service';

@Controller('admin/email-test')
export class AdminEmailController {
  constructor(private readonly emailService: EmailService,
              private readonly orderService: OrderService) {
  }

  @Post('order-confirmation/:orderId')
  async sendTestOrderConfirmEmail(@Param('orderId') orderId: number, @Body() body: any) {
    if (!body.email) {
      throw new BadRequestException(`No 'email' in payload`);
    }

    const order = await this.orderService.getOrderById(parseInt(orderId as any));
    order.customerFirstName = 'Тарас';
    order.customerLastName = 'Шевченко';
    order.customerEmail = body.email;

    return this.emailService.sendOrderConfirmationEmail(order);
  }
}
