import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';
import { Order } from '../order/models/order.model';
import { readableDate } from '../shared/helpers/readable-date.function';
import { isInDocker } from '../shared/helpers/is-in-docker';

@Injectable()
export class PdfGeneratorService {

  private normalizeCssPath = `${__dirname}/assets/css/normalize.css`;
  private typographyCssPath = `${__dirname}/assets/css/typography.css`;
  private orderCssPath = `${__dirname}/assets/css/pdf-order.css`;
  private orderHtmlPath = `${__dirname}/assets/pdf-order.html`;

  async generateOrderPdf(order: Order): Promise<Buffer> {
    const htmlFile = fs.readFileSync(this.orderHtmlPath, 'utf8');
    const html = handlebars.compile(htmlFile)(this.buildTemplateContextForOrder(order));

    const launchOptions: puppeteer.LaunchOptions = {
      headless: true,
      args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox']
    };
    if (isInDocker()) {
      launchOptions.executablePath = '/usr/bin/chromium-browser';
    }

    const browser = await puppeteer.launch(launchOptions);
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
      orderId: order.idForCustomer,
      orderDateTime: readableDate(order.createdAt),
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
        cost: item.cost,
        imageUrl: item.imageUrl,
        slug: item.slug
      })),
      totalProductsCost: order.totalItemsCost,
      discountPercent: order.discountPercent,
      discountValue: order.discountValue
    };
  }
}


