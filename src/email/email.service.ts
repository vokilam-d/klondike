import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import { Order } from '../order/models/order.model';
import { PdfGeneratorService } from '../pdf-generator/pdf-generator.service';
import { readableDate } from '../shared/helpers/readable-date.function';

enum EEmailType {
  EmailConfirmation = 'email-confirmation',
  RegistrationSuccess = 'registration-success',
  OrderConfirmation = 'order-confirmation'
}

@Injectable()
export class EmailService {

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

  async sendOrderConfirmationEmail(order: Order) {
    const to = `${order.customerFirstName} ${order.customerLastName} <${order.customerEmail}>`;

    const subject = `Ваш заказ №${order.idForCustomer} получен`;

    const context = this.getOrderConfirmationTemplateContext(order);
    const html = this.getEmailHtml(EEmailType.OrderConfirmation, context);

    const attachment = {
      filename: `Заказ №${order.idForCustomer}.pdf`,
      content: await this.pdfGeneratorService.generateOrderPdf(order)
    };

    return this.sendEmail(to, subject, html, attachment);
  }

  async sendRegisterConfirmEmail(email: string, confirmationLink: string) {
    const to = email;
    const subject = 'Подтвердите email';
    const html = this.getEmailHtml(EEmailType.EmailConfirmation, { confirmationLink, email });

    return this.sendEmail(to, subject, html);
  }

  async sendRegisterSuccessEmail(email: string, firstName: string, lastName: string) {
    const to = email;
    const subject = 'Добро пожаловать';
    const html = this.getEmailHtml(EEmailType.RegistrationSuccess, { email, firstName, lastName });

    return this.sendEmail(to, subject, html);
  }

  private async sendEmail(to: string, subject: string, html: string, attachment?: any) {
    const transport = await nodemailer.createTransport(this.transportOptions);
    const attachments = [];
    if (attachment) { attachments.push(attachment); }

    return transport.sendMail({
      from: this.senderName,
      to: to,
      subject: subject,
      html,
      attachments
    });
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
      addressName: `${order.address.lastName} ${order.address.firstName}`,
      addressPhone: order.address.phoneNumber,
      addressCity: order.address.city,
      addressPost: order.address.novaposhtaOffice,
      addressStreet: order.address.streetName,
      shipping: order.shippingMethodClientName,
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
}
