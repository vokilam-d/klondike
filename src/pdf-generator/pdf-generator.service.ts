import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';
import { Order } from '../order/models/order.model';
import { readableDate } from '../shared/helpers/readable-date.function';
import { isInDocker } from '../shared/helpers/is-in-docker';

@Injectable()
export class PdfGeneratorService implements OnApplicationBootstrap, OnApplicationShutdown {

  private normalizeCssPath = `${__dirname}/assets/css/normalize.css`;
  private typographyCssPath = `${__dirname}/assets/css/typography.css`;
  private orderCssPath = `${__dirname}/assets/css/pdf-order.css`;
  private orderHtmlPath = `${__dirname}/assets/pdf-order.html`;

  private browser: puppeteer.Browser;

  async onApplicationBootstrap(): Promise<any> {
    await this.launchBrowser();
  }

  async onApplicationShutdown(signal?: string): Promise<any> {
    await this.closeBrowser();
  }

  async generateOrderPdf(order: Order): Promise<Buffer> {
    const htmlFile = fs.readFileSync(this.orderHtmlPath, 'utf8');
    const html = handlebars.compile(htmlFile)(this.buildTemplateContextForOrder(order));

    const page = await this.browser.newPage();

    await page.setContent(html);
    await page.addStyleTag({ path: this.typographyCssPath });
    await page.addStyleTag({ path: this.normalizeCssPath });
    await page.addStyleTag({ path: this.orderCssPath });
    await page.evaluateHandle('document.fonts.ready');

    const pdf = await page.pdf({ format: 'A4', printBackground: true });

    await page.close();

    return pdf;
  }

  private buildTemplateContextForOrder(order: Order): any {
    return {
      orderId: order.idForCustomer,
      orderDateTime: readableDate(order.createdAt),
      totalOrderCost: order.prices.totalCost,
      addressName: `${order.shipment.recipient.firstName} ${order.shipment.recipient.lastName}`,
      addressPhone: order.shipment.recipient.phone,
      addressCity: order.shipment.recipient.settlement,
      address: order.shipment.recipient.address,
      addressBuildingNumber: order.shipment.recipient.buildingNumber,
      addressFlatNumber: order.shipment.recipient.flat,
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
      totalProductsCost: order.prices.itemsCost,
      discountLabel: order.prices.discountLabel,
      discountPercent: order.prices.discountPercent,
      discountValue: order.prices.discountValue
    };
  }

  private async launchBrowser() {
    const launchOptions: puppeteer.LaunchOptions = {
      headless: true,
      args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox', "--disable-gpu", "--single-process", "--no-zygote"]
    };
    if (isInDocker()) {
      launchOptions.executablePath = '/usr/bin/chromium-browser';
    }

    this.browser = await puppeteer.launch(launchOptions);
  }

  private async closeBrowser() {
    await this.browser.close();
  }
}


