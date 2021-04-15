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
import { isFreeShippingForOrder } from '../shared/helpers/is-free-shipping-for-order.function';
import { Language } from '../shared/enums/language.enum';
import { clientDefaultLanguage } from '../shared/constants';
import { isProdEnv } from '../shared/helpers/is-prod-env.function';

enum EEmailType {
  EmailConfirmation = 'email-confirmation',
  RegistrationSuccess = 'registration-success',
  NewProductReview = 'new-product-review',
  NewStoreReview = 'new-store-review',
  ResetPassword = 'password-reset',
  LeaveReview = 'leave-review',
  OrderConfirmation = 'order-confirmation',
  NewManagerAssignedToOrder = 'new-manager-assigned-to-order'
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachment?: any;
  emailType: EEmailType;
}

interface EmailProduct {
  name: string;
  imageUrl: string;
  slug: string;
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
  private newReviewListenerEmails: string = ['yurii@klondike.com.ua', 'elena@klondike.com.ua', 'masloirina15@gmail.com', 'irina@klondike.com.ua', 'elena.sergeevna@klondike.com.ua'].join(',');
  private newOrderListenerEmails: string = ['masloirina15@gmail.com', 'irina@klondike.com.ua'].join(',');
  private newOrderManagerAssignedListenerEmails: string = ['yurii@klondike.com.ua', 'elena@klondike.com.ua', 'kristina@klondike.com.ua', 'kmaslo41@gmail.com'].join(',');

  constructor(private readonly pdfGeneratorService: PdfGeneratorService) {
  }

  async sendOrderConfirmationEmail(order: Order, lang: Language, notifyManagers: boolean, notifyClient: boolean) {
    const emailType = EEmailType.OrderConfirmation;
    const html = this.generateOrderEmailHtml(order, emailType);
    const attachment = await this.generateOrderAttachment(order, lang);

    if (notifyManagers) {
      const to = this.newOrderListenerEmails;
      const subject = `Новый заказ №${order.idForCustomer} (${order.customerContactInfo.lastName}).`
        + ` Менеджер ${order.manager?.name}. Оформил ${order.source}`;
      this.sendEmail({ to, subject, html, attachment, emailType }).then();
    }

    if (notifyClient && order.customerContactInfo.email) {
      const to = `${order.customerContactInfo.firstName} ${order.customerContactInfo.lastName} <${order.customerContactInfo.email}>`;
      const subject = `Ваш заказ №${order.idForCustomer} получен`;
      return this.sendEmail({ to, subject, html, attachment, emailType });
    }
  }

  private async generateOrderAttachment(order: Order, lang: Language) {
    return {
      filename: `Заказ №${order.idForCustomer}.pdf`,
      content: await this.pdfGeneratorService.generateOrderPdf(order, lang)
    };
  }

  private generateOrderEmailHtml(order: Order, emailType: EEmailType) {
    const context = this.getOrderConfirmationTemplateContext(order);
    return this.getEmailHtml(emailType, context);
  }

  async sendAssignedOrderManagerEmail(order: Order) {
    if (!isProdEnv()) { return; }

    const subject = `Заказ №${order.idForCustomer} (${order.customerContactInfo.lastName}) `
      + `назначен менеджеру ${order.manager.name}. Оформил ${order.source}`;

    return this.sendEmail({
      to: this.newOrderManagerAssignedListenerEmails,
      subject,
      html: await this.generateOrderEmailHtml(order, EEmailType.OrderConfirmation),
      attachment: await this.generateOrderAttachment(order, Language.RU),
      emailType: EEmailType.NewManagerAssignedToOrder
    });
  }

  async sendLeaveReviewEmail(order: Order, lang: Language) {
    const emailType = EEmailType.LeaveReview;
    const to = `${order.customerContactInfo.firstName} ${order.customerContactInfo.lastName} <${order.customerContactInfo.email}>`;
    const subject = `${order.customerContactInfo.firstName}, поделитесь мнением о покупке`;

    const context = this.getLeaveReviewTemplateContext(order, lang);
    const html = this.getEmailHtml(emailType, context);

    return this.sendEmail({ to, subject, html, emailType });
  }

  sendRegisterSuccessEmail(customer: Customer, token: string) {
    const emailType = EEmailType.RegistrationSuccess;
    const to = customer.contactInfo.email;
    const subject = 'Добро пожаловать';
    const html = this.getEmailHtml(
      emailType,
      { email: customer.contactInfo.email, firstName: customer.contactInfo.firstName, token }
    );

    return this.sendEmail({ to, subject, html, emailType });
  }

  sendEmailConfirmationEmail(customer: Customer, token: string) {
    const emailType = EEmailType.EmailConfirmation;
    const to = customer.contactInfo.email;
    const subject = 'Подтвердите email';
    const html = this.getEmailHtml(
      emailType,
      { email: customer.contactInfo.email, firstName: customer.contactInfo.firstName, token }
    );

    return this.sendEmail({ to, subject, html, emailType });
  }

  sendResetPasswordEmail(customer: Customer, token: string) {
    const emailType = EEmailType.ResetPassword;
    const to = customer.contactInfo.email;
    const subject = 'Восстановление пароля';
    const html = this.getEmailHtml(emailType, { firstName: customer.contactInfo.firstName, token });

    return this.sendEmail({ to, subject, html, emailType });
  }

  sendNewProductReviewEmail(productReview: AdminProductReviewDto, to: string = this.newReviewListenerEmails) {
    const emailType = EEmailType.NewProductReview;
    const subject = 'Новый отзыв о товаре';
    const html = this.getEmailHtml(emailType, this.getNewProductReviewTemplateContext(productReview));

    return this.sendEmail({ to, subject, html, emailType });
  }

  sendNewStoreReviewEmail(storeReview: AdminStoreReviewDto, to: string = this.newReviewListenerEmails) {
    const emailType = EEmailType.NewStoreReview;
    const subject = 'Новый отзыв о магазине';
    const html = this.getEmailHtml(emailType, this.getNewStoreReviewTemplateContext(storeReview));

    return this.sendEmail({ to, subject, html, emailType });
  }

  public async sendEmail({ to, subject, html, attachment, emailType }: SendEmailOptions) {
    const transport = await nodemailer.createTransport(this.transportOptions);
    const attachments = [];
    if (attachment) { attachments.push(attachment); }

    const send = async (resolve, reject, tryCount: number = 0) => {
      try {
        await transport.sendMail({ from: this.senderName, to, subject, html, attachments });
        this.logger.log(`Sent "${emailType}" email to "${to}"`);

        resolve();
      } catch (e) {
        this.logger.error(`Could not send "${emailType}" email to "${to}": ${e}`);
        this.logger.error(e);

        if (tryCount > 4) {
          reject(e);
          return;
        }

        const delayTime = tryCount * 3.5 * 1000;
        this.logger.warn(`Retrying in ${delayTime}s...`);
        setTimeout(() => send(resolve, reject, tryCount + 1), delayTime);
      }
    };

    return new Promise(send);
  }

  private getEmailHtml(emailType: EEmailType, templateContext: any = {}): string {
    const filepath: string = `${__dirname}/templates/${emailType}.html`;

    return handlebars.compile(fs.readFileSync(filepath, 'utf8'))(templateContext);
  }

  private getOrderConfirmationTemplateContext(order: Order): any {
    return {
      firstName: order.customerContactInfo.firstName,
      orderId: order.idForCustomer,
      orderDateTime: readableDate(order.createdAt),
      totalOrderCost: order.prices.totalCost,
      addressName: `${order.shipment.recipient.contactInfo.lastName} ${order.shipment.recipient.contactInfo.firstName} ${order.shipment.recipient.contactInfo.middleName}`,
      addressPhone: order.shipment.recipient.contactInfo.phoneNumber,
      addressCity: order.shipment.recipient.address.settlementNameFull,
      address: order.shipment.recipient.address.addressNameFull,
      addressBuildingNumber: order.shipment.recipient.address.buildingNumber,
      addressFlatNumber: order.shipment.recipient.address.flat,
      shipping: order.shipment.shippingMethodDescription[clientDefaultLanguage],
      shippingTip: isFreeShippingForOrder(order) ? 'бесплатная доставка' : 'оплачивается получателем',
      payment: order.paymentInfo.methodClientName[clientDefaultLanguage],
      products: order.items.map(item => ({
        name: item.name[clientDefaultLanguage],
        sku: item.sku,
        vendorCode: item.vendorCode,
        qty: item.qty,
        price: item.price,
        oldPrice: item.oldPrice,
        cost: item.cost,
        imageUrl: item.imageUrl,
        slug: item.slug,
        additionalServices: item.additionalServices.map(service => `${service.name[clientDefaultLanguage]} (+${service.price}грн)`)
      })),
      totalProductsCost: order.prices.itemsCost,
      discountValue: order.prices.discountValue,
      clientNote: order.notes.fromCustomer,
      isCallbackNeeded: order.isCallbackNeeded
    };
  }

  private getLeaveReviewTemplateContext(order: Order, lang: Language): any {

    const productsInRow = 3;
    const productRows: EmailProduct[][] = [];

    for (let i = 0; i < order.items.length; i++) {
      let item = order.items[i];
      const rowIndex = Math.floor(i / productsInRow);
      productRows[rowIndex] = productRows[rowIndex] || [];

      productRows[rowIndex].push({ name: item.name[lang], imageUrl: item.imageUrl, slug: item.slug });
    }

    return {
      firstName: order.customerContactInfo.firstName,
      customerId: order.customerId,
      email: order.customerContactInfo.email,
      productRows
    };
  }

  private getNewProductReviewTemplateContext(productReview: AdminProductReviewDto): any {
    return {
      id: productReview.id,
      name: productReview.name,
      text: productReview.text,
      rating: productReview.rating,
      product: productReview.productName,
      source: productReview.source,
    };
  }

  private getNewStoreReviewTemplateContext(storeReview: AdminStoreReviewDto): any {
    return {
      id: storeReview.id,
      name: storeReview.name,
      text: storeReview.text,
      rating: storeReview.rating,
      source: storeReview.source
    };
  }
}
