import { BadRequestException, Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { OrderService } from '../order/services/order.service';
import { UserJwtGuard } from '../auth/guards/user-jwt.guard';
import { ModuleRef } from '@nestjs/core';
import { __ } from '../shared/helpers/translate/translate.function';
import { ProductReviewService } from '../reviews/product-review/product-review.service';
import { StoreReviewService } from '../reviews/store-review/store-review.service';
import { AdminLang } from '../shared/decorators/lang.decorator';
import { Language } from '../shared/enums/language.enum';
import { TaxService } from '../tax/services/tax.service';

@UseGuards(UserJwtGuard)
@Controller('admin/email-test')
export class AdminEmailController {

  private testFirstName = 'Тарас';
  private testLastName = 'Шевченко';

  constructor(
    private readonly emailService: EmailService,
    private readonly moduleRef: ModuleRef
  ) { }

  @Post('order-confirmation/:orderId')
  async sendTestOrderConfirmEmail(
    @Param('orderId') orderId: number,
    @Body() body: any,
    @AdminLang() lang: Language
  ) {
    if (!body.email) {
      throw new BadRequestException(__('No "email" in payload', lang));
    }

    const orderService = this.moduleRef.get(OrderService, { strict: false });
    const order = await orderService.getOrderById(parseInt(orderId as any), lang);
    order.customerContactInfo.email = body.email;

    return this.emailService.sendOrderConfirmationEmail(order, lang, false, true);
  }

  @Post('leave-review/:orderId')
  async sendTestLeaveReviewEmail(
    @Param('orderId') orderId: number,
    @Body() body: any,
    @AdminLang() lang: Language
  ) {
    if (!body.email) {
      throw new BadRequestException(__('No "email" in payload', lang));
    }

    const orderService = this.moduleRef.get(OrderService, { strict: false });
    const order = await orderService.getOrderById(parseInt(orderId as any), lang);
    order.customerContactInfo.email = body.email;

    return this.emailService.sendLeaveReviewEmail(order, lang);
  }

  @Post('tax-receipt/:orderId')
  async sendTaxReceiptEmail(
    @Param('orderId') orderId: number,
    @Body() body: any,
    @AdminLang() lang: Language
  ) {
    if (!body.email) {
      throw new BadRequestException(__('No "email" in payload', lang));
    }

    const orderService = this.moduleRef.get(OrderService, { strict: false });
    const order = await orderService.getOrderById(parseInt(orderId as any), lang);

    if (!order.receiptId) {
      throw new BadRequestException(__(`Order with id "$1" has not receipt`, lang, order.id));
    }

    const taxService = this.moduleRef.get(TaxService, { strict: false });
    const receipt = await taxService.getReceipt(order.receiptId);

    return this.emailService.sendReceiptEmail(order, receipt, body.email);
  }

  @Post('email-confirmation')
  async sendEmailConfirmationEmail(@Body() body: any, @AdminLang() lang: Language) {
    if (!body.email) {
      throw new BadRequestException(__('No "email" in payload', lang));
    }

    const customer: any = {
      email: body.email,
      firstName: this.testFirstName,
      lastName: this.testLastName
    };

    return this.emailService.sendEmailConfirmationEmail(customer, 'token');
  }

  @Post('registration-success')
  async sendRegisterSuccessEmail(@Body() body: any, @AdminLang() lang: Language) {
    if (!body.email) {
      throw new BadRequestException(__('No "email" in payload', lang));
    }

    const customer: any = {
      email: body.email,
      firstName: this.testFirstName,
      lastName: this.testLastName
    };

    return this.emailService.sendRegisterSuccessEmail(customer, 'token');
  }

  @Post('reset-password')
  async sendResetPasswordEmail(@Body() body: any, @AdminLang() lang: Language) {
    if (!body.email) {
      throw new BadRequestException(__('No "email" in payload', lang));
    }

    const customer: any = {
      email: body.email,
      firstName: this.testFirstName,
      lastName: this.testLastName
    };

    return this.emailService.sendResetPasswordEmail(customer, 'token');
  }

  @Post('new-product-review/:reviewId')
  async sendTestNewProductReviewEmail(
    @Param('reviewId') reviewId: string,
    @Body() body: any,
    @AdminLang() lang: Language
  ) {
    if (!body.email) {
      throw new BadRequestException(__('No "email" in payload', lang));
    }

    const productReviewService = this.moduleRef.get(ProductReviewService, { strict: false });
    const review = await productReviewService.findReview(reviewId, lang);

    return this.emailService.sendNewProductReviewEmail(review, body.email);
  }

  @Post('new-store-review/:reviewId')
  async sendTestNewStoreReviewEmail(
    @Param('reviewId') reviewId: string,
    @Body() body: any,
    @AdminLang() lang: Language
  ) {
    if (!body.email) {
      throw new BadRequestException(__('No "email" in payload', lang));
    }

    const storeReviewService = this.moduleRef.get(StoreReviewService, { strict: false });
    const review = await storeReviewService.findReview(reviewId, lang);

    return this.emailService.sendNewStoreReviewEmail(review, body.email);
  }
}
