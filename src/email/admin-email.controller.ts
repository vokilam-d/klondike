import { BadRequestException, Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { OrderService } from '../order/order.service';
import { UserJwtGuard } from '../auth/services/guards/user-jwt.guard';

@UseGuards(UserJwtGuard)
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
  async sendEmailConfirmationEmail(@Param('orderId') orderId: number, @Body() body: any) {
    if (!body.email) {
      throw new BadRequestException(`No 'email' in payload`);
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
      throw new BadRequestException(`No 'email' in payload`);
    }

    const customer: any = {
      email: body.email,
      firstName: this.testFirstName,
      lastName: this.testLastName
    };

    return this.emailService.sendRegisterSuccessEmail(customer, 'token');
  }
}
