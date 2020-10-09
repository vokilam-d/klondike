import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import { Order } from '../order/models/order.model';
import { PdfGeneratorService } from '../pdf-generator/pdf-generator.service';
import { readableDate } from '../shared/helpers/readable-date.function';
import { Customer } from '../customer/models/customer.model';
import { AdminProductReviewDto } from '../shared/dtos/admin/product-review.dto';
import { AdminStoreReviewDto } from '../shared/dtos/admin/store-review.dto';

enum EEmailType {
  EmailConfirmation = 'email-confirmation',
  RegistrationSuccess = 'registration-success',
  NewProductReview = 'new-product-review',
  NewStoreReview = 'new-store-review',
  ResetPassword = 'password-reset',
  LeaveReview = 'leave-review',
  OrderConfirmation = 'order-confirmation'
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachment?: any;
  emailType: EEmailType;
}

@Injectable()
export class EmailService {

  private logger = new Logger(EmailService.name);
  private transportOptions = {
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  };
  private senderName = 'Клондайк <info@klondike.com.ua>';
  private managerEmails: string = ['denis@klondike.com.ua', 'yurii@klondike.com.ua', 'elena@klondike.com.ua', 'masloirina15@gmail.com', 'irina@klondike.com.ua'].join(',');

  constructor(private readonly pdfGeneratorService: PdfGeneratorService) {
  }

  async sendOrderConfirmationEmail(order: Order, notifyManager: boolean) {
    const emailType = EEmailType.OrderConfirmation;
    const to = `${order.customerFirstName} ${order.customerLastName} <${order.customerEmail}>`;

    const subject = `Ваш заказ №${order.idForCustomer} получен`;

    const context = this.getOrderConfirmationTemplateContext(order);
    const html = this.getEmailHtml(emailType, context);

    const attachment = {
      filename: `Заказ №${order.idForCustomer}.pdf`,
      content: await this.pdfGeneratorService.generateOrderPdf(order)
    };

    if (notifyManager) {
      const managerSubject = `Новый заказ №${order.idForCustomer}`;
      this.sendEmail({ to: this.managerEmails, subject: managerSubject, html, attachment, emailType }).then();
    }

    return this.sendEmail({ to, subject, html, attachment, emailType });
  }

  async sendLeaveReviewEmail(order: Order) {
    const emailType = EEmailType.LeaveReview;
    const to = `${order.customerFirstName} ${order.customerLastName} <${order.customerEmail}>`;

    const subject = `${order.customerFirstName}, оставьте отзыв о товаре`;

    const context = this.getLeaveReviewTemplateContext(order);
    const html = this.getEmailHtml(emailType, context);

    return this.sendEmail({ to, subject, html, emailType });
  }

  sendRegisterSuccessEmail(customer: Customer, token: string) {
    const emailType = EEmailType.RegistrationSuccess;
    const to = customer.email;
    const subject = 'Добро пожаловать';
    const html = this.getEmailHtml(
      emailType,
      { email: customer.email, firstName: customer.firstName, lastName: customer.lastName, token }
    );

    return this.sendEmail({ to, subject, html, emailType });
  }

  sendEmailConfirmationEmail(customer: Customer, token: string) {
    const emailType = EEmailType.EmailConfirmation;
    const to = customer.email;
    const subject = 'Подтвердите email';
    const html = this.getEmailHtml(
      emailType,
      { email: customer.email, firstName: customer.firstName, lastName: customer.lastName, token }
    );

    return this.sendEmail({ to, subject, html, emailType });
  }

  sendResetPasswordEmail(customer: Customer, token: string) {
    const emailType = EEmailType.ResetPassword;
    const to = customer.email;
    const subject = 'Восстановление пароля';
    const html = this.getEmailHtml(emailType, { firstName: customer.firstName, lastName: customer.lastName, token });

    return this.sendEmail({ to, subject, html, emailType });
  }

  sendNewProductReviewEmail(productReview: AdminProductReviewDto, to: string = this.managerEmails) {
    const emailType = EEmailType.NewProductReview;
    const subject = 'Новый отзыв о товаре';
    const html = this.getEmailHtml(emailType, this.getNewProductReviewTemplateContext(productReview));

    return this.sendEmail({ to, subject, html, emailType });
  }

  sendNewStoreReviewEmail(storeReview: AdminStoreReviewDto, to: string = this.managerEmails) {
    const emailType = EEmailType.NewStoreReview;
    const subject = 'Новый отзыв о магазине';
    const html = this.getEmailHtml(emailType, this.getNewStoreReviewTemplateContext(storeReview));

    return this.sendEmail({ to, subject, html, emailType });
  }

  private async sendEmail({ to, subject, html, attachment, emailType }: SendEmailOptions) {
    const transport = await nodemailer.createTransport(this.transportOptions);
    const attachments = [];
    if (attachment) { attachments.push(attachment); }

    const send = async (tryCount: number = 0) => {
      const delayTime = tryCount * 3.5 * 1000;

      setTimeout(async () => {
        try {
          await transport.sendMail({ from: this.senderName, to, subject, html, attachments });

          this.logger.log(`Sent "${emailType}" email to "${to}"`);
        } catch (e) {
          this.logger.error(`Could not send "${emailType}" email to "${to}": ${e}`);
          this.logger.error(e);

          if (tryCount <= 4) {
            this.logger.warn(`Retrying in ${tryCount + 1}...`);
            await send(tryCount + 1);
          }
        }
      }, delayTime);
    };

    await send();
  }

  private getEmailHtml(emailType: EEmailType, templateContext: any = {}): string {
    const filepath: string = `${__dirname}/templates/${emailType}.html`;

    return handlebars.compile(fs.readFileSync(filepath, 'utf8'))(templateContext);
  }

  private getOrderConfirmationTemplateContext(order: Order): any {
    return {
      firstName: order.customerFirstName,
      lastName: order.customerLastName,
      orderId: order.idForCustomer,
      orderDateTime: readableDate(order.createdAt),
      totalOrderCost: order.prices.totalCost,
      addressName: `${order.shipment.recipient.lastName} ${order.shipment.recipient.firstName}`,
      addressPhone: order.shipment.recipient.phone,
      addressCity: order.shipment.recipient.settlement,
      address: order.shipment.recipient.address,
      addressBuildingNumber: order.shipment.recipient.buildingNumber,
      addressFlatNumber: order.shipment.recipient.flat,
      shipping: order.shippingMethodName,
      shippingTip: order.prices.totalCost < 1000 ? 'оплачивается получателем' : 'бесплатная доставка',
      payment: order.paymentMethodClientName,
      products: order.items.map(item => ({
        name: item.name,
        sku: item.sku,
        qty: item.qty,
        price: item.price,
        cost: item.cost,
        imageUrl: item.imageUrl,
        slug: item.slug
      })),
      totalProductsCost: order.prices.itemsCost,
      discountLabel: order.prices.discountLabel,
      discountPercent: order.prices.discountPercent,
      discountValue: order.prices.discountValue,
      clientNote: order.clientNote,
      isCallbackNeeded: order.isCallbackNeeded
    };
  }

  private getLeaveReviewTemplateContext(order: Order): any {
    let mainProductIdx = 0;
    order.items.forEach((item, index) => {
      if (item.price > order.items[mainProductIdx].price) {
        mainProductIdx = index;
      }
    });

    const products = order.items
      .filter((item, index) => index !== mainProductIdx)
      .map(item => ({ name: item.name, imageUrl: item.imageUrl, slug: item.slug }))

    return {
      firstName: order.customerFirstName,
      lastName: order.customerLastName,
      mainProductSlug: order.items[mainProductIdx].slug,
      mainProductName: order.items[mainProductIdx].name,
      mainProductId: order.items[mainProductIdx].productId,
      mainProductVariantId: order.items[mainProductIdx].variantId,
      customerId: order.customerId,
      email: order.customerEmail,
      products
    };
  }

  private getNewProductReviewTemplateContext(productReview: AdminProductReviewDto): any {
    return {
      id: productReview.id,
      name: productReview.name,
      text: productReview.text,
      rating: productReview.rating,
      product: productReview.productName
    };
  }

  private getNewStoreReviewTemplateContext(storeReview: AdminStoreReviewDto): any {
    return {
      id: storeReview.id,
      name: storeReview.name,
      text: storeReview.text,
      rating: storeReview.rating
    };
  }
}
