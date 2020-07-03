import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import { Order } from '../order/models/order.model';
import { PdfGeneratorService } from '../pdf-generator/pdf-generator.service';
import { readableDate } from '../shared/helpers/readable-date.function';
import { Customer } from '../customer/models/customer.model';

enum EEmailType {
  EmailConfirmation = 'email-confirmation',
  RegistrationSuccess = 'registration-success',
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

  constructor(private readonly pdfGeneratorService: PdfGeneratorService) {
  }

  async sendOrderConfirmationEmail(order: Order, notifyManager: boolean) {
    const to = `${order.customerFirstName} ${order.customerLastName} <${order.customerEmail}>`;

    const subject = `Ваш заказ №${order.idForCustomer} получен`;

    const context = this.getOrderConfirmationTemplateContext(order);
    const html = this.getEmailHtml(EEmailType.OrderConfirmation, context);

    const attachment = {
      filename: `Заказ №${order.idForCustomer}.pdf`,
      content: await this.pdfGeneratorService.generateOrderPdf(order)
    };

    if (notifyManager) {
      const managerEmail = this.senderName;
      const managerSubject = `Новый заказ №${order.idForCustomer}`;
      this.sendEmail({ to: managerEmail, subject: managerSubject, html, attachment, emailType: EEmailType.OrderConfirmation })
        .then();
    }

    return this.sendEmail({ to, subject, html, attachment, emailType: EEmailType.OrderConfirmation });
  }

  async sendLeaveReviewEmail(order: Order) {
    const to = `${order.customerFirstName} ${order.customerLastName} <${order.customerEmail}>`;

    const subject = `${order.customerFirstName}, оставьте отзыв о товаре`;

    const context = this.getLeaveReviewTemplateContext(order);
    const html = this.getEmailHtml(EEmailType.LeaveReview, context);

    return this.sendEmail({ to, subject, html, emailType: EEmailType.LeaveReview });
  }

  sendRegisterSuccessEmail(customer: Customer, token: string) {
    const to = customer.email;
    const subject = 'Добро пожаловать';
    const html = this.getEmailHtml(
      EEmailType.RegistrationSuccess,
      { email: customer.email, firstName: customer.firstName, lastName: customer.lastName, token }
    );

    return this.sendEmail({ to, subject, html, emailType: EEmailType.RegistrationSuccess });
  }

  sendEmailConfirmationEmail(customer: Customer, token: string) {
    const to = customer.email;
    const subject = 'Подтвердите email';
    const html = this.getEmailHtml(
      EEmailType.EmailConfirmation,
      { email: customer.email, firstName: customer.firstName, lastName: customer.lastName, token }
    );

    return this.sendEmail({ to, subject, html, emailType: EEmailType.EmailConfirmation });
  }

  sendResetPasswordEmail(customer: Customer, token: string) {
    const to = customer.email;
    const subject = 'Восстановление пароля';
    const html = this.getEmailHtml(EEmailType.ResetPassword, { firstName: customer.firstName, lastName: customer.lastName, token });

    return this.sendEmail({ to, subject, html, emailType: EEmailType.ResetPassword });
  }

  private async sendEmail({ to, subject, html, attachment, emailType }: SendEmailOptions) {
    const transport = await nodemailer.createTransport(this.transportOptions);
    const attachments = [];
    if (attachment) { attachments.push(attachment); }

    try {
      await transport.sendMail({
        from: this.senderName,
        to: to,
        subject: subject,
        html,
        attachments
      });

      this.logger.log(`Sent email "${emailType}" email to "${to}"`);
    } catch (e) {
      this.logger.error(`Could not send "${emailType}" email to "${to}": ${e}`);
      this.logger.error(e);
    }
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
      totalOrderCost: order.totalCost,
      addressName: `${order.shipment.recipient.lastName} ${order.shipment.recipient.firstName}`,
      addressPhone: order.shipment.recipient.phone,
      addressCity: order.shipment.recipient.settlement,
      addressPost: order.shipment.recipient.address,
      shipping: order.shippingMethodName,
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
      totalProductsCost: order.totalItemsCost,
      discountPercent: order.discountPercent,
      discountValue: order.discountValue,
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
}
