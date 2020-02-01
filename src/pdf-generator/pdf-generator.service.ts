import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
// import * as htmlPdf from 'html-pdf';
import * as handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';
import { Order } from '../order/models/order.model';
import { addLeadingZeros } from '../shared/helpers/add-leading-zeros.function';

@Injectable()
export class PdfGeneratorService {

  private normalizeCssPath = `${__dirname}/assets/css/normalize.css`;
  private typographyCssPath = `${__dirname}/assets/css/typography.css`;
  private orderCssPath = `${__dirname}/assets/css/pdf-order.css`;
  private orderHtmlPath = `${__dirname}/assets/pdf-order.html`;

  async generateOrderPdf(order: Order): Promise<Buffer> {
    const htmlFile = fs.readFileSync(this.orderHtmlPath, 'utf8');
    const html = handlebars.compile(htmlFile)(this.buildTemplateContextForOrder(order));

    const browser = await puppeteer.launch({ headless: true });
    const [page] = await browser.pages();

    await page.setContent(html);
    await page.addStyleTag({ path: this.typographyCssPath });
    await page.addStyleTag({ path: this.normalizeCssPath });
    await page.addStyleTag({ path: this.orderCssPath });
    await page.evaluateHandle('document.fonts.ready');

    const pdf = await page.pdf({ format: 'A4', printBackground: true });

    await browser.close();

    return pdf;
  }

  private buildTemplateContextForOrder(order: Order): any {
    return {
      id: order.idForCustomer,
      date: this.convertDate(order.createdAt),
      totalOrderCost: order.totalCost,
      addressName: `${order.address.firstName} ${order.address.lastName}`,
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
        cost: item.cost
      })),
      totalProductsCost: order.totalItemsCost,
      discountPercent: order.discountPercent,
      discountValue: order.discountValue
    }
  }

  private convertDate(date: Date): string {
    const day = addLeadingZeros(date.getDay(), 2);
    const month = MONTHS[date.getMonth()];
    const year = date.getFullYear();
    const hours = addLeadingZeros(date.getHours(), 2);
    const minutes = addLeadingZeros(date.getMinutes(), 2);

    return `${day} ${month} ${year} г., ${hours}:${minutes}`;
  }
}

const MONTHS = [
  'янв.',
  'фев.',
  'март.',
  'апр.',
  'май',
  'июнь',
  'июль',
  'авг.',
  'сен.',
  'окт.',
  'ноя.',
  'дек.',
];
