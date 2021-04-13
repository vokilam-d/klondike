import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';
import { convert } from 'number-to-cyrillic';
import { Order } from '../order/models/order.model';
import { readableDate } from '../shared/helpers/readable-date.function';
import { isInDocker } from '../shared/helpers/is-in-docker';
import { isFreeShippingForOrder } from '../shared/helpers/is-free-shipping-for-order.function';
import { Language } from '../shared/enums/language.enum';
import { InvoiceEditDto } from '../shared/dtos/admin/invoice-edit.dto';

@Injectable()
export class PdfGeneratorService implements OnApplicationBootstrap, OnApplicationShutdown {

  private normalizeCssPath = `${__dirname}/assets/css/normalize.css`;
  private typographyCssPath = `${__dirname}/assets/css/typography.css`;
  private orderCssPath = `${__dirname}/assets/css/pdf-order.css`;
  private orderHtmlPath = `${__dirname}/assets/pdf-order.html`;
  private invoiceCssPath = `${__dirname}/assets/css/pdf-invoice.css`;
  private invoiceHtmlPath = `${__dirname}/assets/pdf-invoice.html`;

  private browser: puppeteer.Browser;

  async onApplicationBootstrap(): Promise<any> {
    await this.launchBrowser();
  }

  async onApplicationShutdown(signal?: string): Promise<any> {
    await this.closeBrowser();
  }

  async generateOrderPdf(order: Order, lang: Language): Promise<Buffer> {
    const context = this.buildTemplateContextForOrder(order, lang);
    return this.generatePdf(this.orderHtmlPath, this.orderCssPath, context);
  }

  async generateInvoicePdf(order: Order, editDto: InvoiceEditDto): Promise<Buffer> {
    const context = this.buildTemplateContextForInvoice(order, editDto);
    return this.generatePdf(this.invoiceHtmlPath, this.invoiceCssPath, context);
  }

  private async generatePdf(htmlPath, cssPath, context) {
    const htmlFile = fs.readFileSync(htmlPath, 'utf8');
    const html = handlebars.compile(htmlFile)(context);

    const page = await this.browser.newPage();

    await page.setContent(html);
    await page.addStyleTag({ path: this.typographyCssPath });
    await page.addStyleTag({ path: this.normalizeCssPath });
    await page.addStyleTag({ path: cssPath });
    await page.evaluateHandle('document.fonts.ready');

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: 25,
        right: 25,
        bottom: 25,
        left: 25
      }
    });

    await page.close();

    return pdf;
  }

  private buildTemplateContextForOrder(order: Order, lang: Language): any {
    const recipient = order.shipment.recipient;

    return {
      orderId: order.idForCustomer,
      orderDateTime: readableDate(order.createdAt),
      totalOrderCost: order.prices.totalCost,
      addressName: recipient.middleName ? `${recipient.firstName} ${recipient.lastName}` : `${recipient.lastName} ${recipient.firstName} ${recipient.middleName}`,
      addressPhone: recipient.phone,
      addressCity: recipient.settlementFull || recipient.settlement,
      address: recipient.addressFull || recipient.address,
      addressBuildingNumber: recipient.buildingNumber,
      addressFlatNumber: recipient.flat,
      shipping: order.shippingMethodName[lang],
      shippingTip: isFreeShippingForOrder(order) ? 'бесплатная доставка' : 'оплачивается получателем',
      payment: order.paymentMethodClientName[lang],
      products: order.items.map(item => ({
        name: item.name[lang],
        sku: item.sku,
        vendorCode: item.vendorCode,
        qty: item.qty,
        price: item.price,
        oldPrice: item.oldPrice,
        cost: item.cost,
        imageUrl: item.imageUrl,
        slug: item.slug,
        additionalServices: item.additionalServices.map(service => `${service.name[lang]} (+${service.price}грн)`)
      })),
      totalProductsCost: order.prices.itemsCost,
      discountValue: order.prices.discountValue
    };
  }

  private buildTemplateContextForInvoice(order: Order, editDto: InvoiceEditDto): any {
    const lang: Language = Language.UK;
    const recipient = order.shipment.recipient;

    return {
      orderId: order.id,
      orderDateTime: readableDate(order.createdAt),
      title: editDto.title || 'Видаткова накладна',
      addressName: editDto.addressName || (recipient.middleName ? `${recipient.firstName} ${recipient.lastName}` : `${recipient.lastName} ${recipient.firstName} ${recipient.middleName}`),
      addressPhone: editDto.addressPhone || recipient.phone,
      addressCity: editDto.addressCity || recipient.settlementFull || recipient.settlement,
      address: editDto.address || recipient.addressFull || recipient.address,
      addressBuildingNumber: editDto.addressBuildingNumber || recipient.buildingNumber,
      addressFlatNumber: editDto.addressFlatNumber || recipient.flat,
      totalOrderCost: order.prices.totalCost,
      totalOrderCostInWords: this.convertDigitsToWords(order.prices.totalCost),
      products: order.items.map((item, index) => ({
        index: index + 1,
        name: item.name[lang],
        sku: item.sku,
        vendorCode: item.vendorCode,
        qty: item.qty,
        price: item.price,
        oldPrice: item.oldPrice,
        cost: item.cost,
        additionalServices: item.additionalServices.map(service => `${service.name[lang]} (+${service.price}грн)`)
      })),
      productsAmount: order.items.length,
      totalProductsCost: order.prices.itemsCost,
      discountValue: order.prices.discountValue,
      manager: process.env.BANK_DETAILS_NAME,
      managerNameShort: process.env.BANK_DETAILS_NAME_SHORT,
      bankAccount: process.env.BANK_DETAILS_ACCOUNT,
      bankCard: process.env.BANK_DETAILS_CARD,
      idCode: process.env.BANK_DETAILS_ID,
      showStamp: editDto.hideStamp !== true
    };
  }

  private convertDigitsToWords(itemsCost: number): string {
    const itemsCostInWords = convert(itemsCost.toString(), {
      capitalize: true
    });

    return `${itemsCostInWords.convertedInteger} ${itemsCostInWords.integerCurrency} 00 копійок`;
  }

  private async launchBrowser() {
    const launchOptions: puppeteer.LaunchOptions = {
      headless: true,
      args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--no-zygote']
    };
    if (isInDocker()) {
      launchOptions.executablePath = '/usr/bin/chromium-browser';
      launchOptions.args.push('--single-process');
    }

    this.browser = await puppeteer.launch(launchOptions);
  }

  private async closeBrowser() {
    await this.browser.close();
  }
}
