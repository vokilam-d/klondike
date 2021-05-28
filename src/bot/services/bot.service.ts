import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Order } from '../../order/models/order.model';
import { TelegramApiService } from './telegram-api.service';
import { AdminProductReviewDto } from '../../shared/dtos/admin/product-review.dto';
import { ITelegramInlineKeyboardMarkup } from '../interfaces/inline-keyboard-markup.interface';
import { AdminStoreReviewDto } from '../../shared/dtos/admin/store-review.dto';
import { beautifyPhoneNumber } from '../../shared/helpers/beautify-phone-number.function';
import { BotConfigurationService } from './bot-configuration.service';
import { adminDefaultLanguage } from '../../shared/constants';
import { IPayment } from '../interfaces/payment.interface';
import { ITelegramChat } from '../interfaces/chat.interface';
import { ITelegramUser } from '../interfaces/user.interface';
import { BotCommand } from '../enums/bot-command.enum';
import { MonobankConnector } from './monobank.connector';
import { PrivatbankConnector } from './privatbank.connector';
import { isProdEnv } from '../../shared/helpers/is-prod-env.function';

@Injectable()
export class BotService implements OnApplicationBootstrap {

  private logger = new Logger(BotService.name);

  constructor(
    private readonly telegramApiService: TelegramApiService,
    private readonly botConfig: BotConfigurationService,
    private readonly monobankConnector: MonobankConnector,
    private readonly privatbankConnector: PrivatbankConnector
  ) { }

  async onApplicationBootstrap() {
  }

  async onNewOrder(order: Order): Promise<void> {
    if (!this.botConfig.adminOrderChat) { return; }
    const phone = beautifyPhoneNumber(order.customerContactInfo.phoneNumber || order.shipment.recipient.contactInfo.phoneNumber);
    const _ = this.escapeString;

    let text = `Заказ №${order.id}\n`
      + `${_(order.customerContactInfo.firstName)} ${_(order.customerContactInfo.lastName)}, ${_(phone)}\\.`;

    if (order.notes.aboutCustomer) {
      text += ` \\(_${_(order.notes.aboutCustomer)}_\\)\\.`
    }

    text += `\n`
      + `${_(order.shipment.recipient.address.settlementName)}, ${_(order.shipment.recipient.address.addressName)}\\.\n`
      + `${_(order.paymentInfo.methodAdminName[adminDefaultLanguage])}\\.\n`
      + `${order.isCallbackNeeded ? 'Перезвонить' : 'Не звонить'}\\.\n`
      + `Менеджер: ${order.manager.name}\\.\n`;

    if (order.notes.fromCustomer) {
      text += `Коммент клиента: _${_(order.notes.fromCustomer)}_\\.\n`
    }

    const itemsPluralText = order.items.length === 1 ? 'товар' : order.items.length > 4 ? 'товаров' : 'товара';
    text += `\n*${order.items.length}* ${itemsPluralText} на сумму *${order.prices.totalCost}* грн:\n\n`

    for (let i = 0; i < order.items.length; i++){
      text += `${i + 1}\\. ${_(order.items[i].name.ru)}, ${order.items[i].qty} шт\\.\n`
    }

    const reply: ITelegramInlineKeyboardMarkup = {
      inline_keyboard: [[{
        text: 'Посмотреть в админке',
        url: this.getFrontendUrl('order', order.id)
      }]]
    };

    this.telegramApiService.sendMessage(this.botConfig.adminOrderChat, text, reply);
  }

  async onNewProductReview(review: AdminProductReviewDto): Promise<void> {
    if (!this.botConfig.adminReviewsChat) { return; }

    let text = `*${this.escapeString(review.name)}* оставил\\(а\\) отзыв о товаре *"${this.escapeString(review.productName)}"*\n`
      + `Оценка: *${review.rating}*\n`
      + `Откуда: *${this.escapeString(review.source)}*\n`;

    if (review.medias.length) {
      text += `Кол\\-во фото: *${review.medias.length}*\n`;
    }
    text += `Текст:\n\n`
      + `_${this.escapeString(review.text)}_`;

    const reply: ITelegramInlineKeyboardMarkup = {
      inline_keyboard: [[{
        text: 'Посмотреть в админке',
        url: this.getFrontendUrl('product-review', review.id)
      }]]
    };

    this.telegramApiService.sendMessage(this.botConfig.adminReviewsChat, text, reply);
  }

  async onNewStoreReview(review: AdminStoreReviewDto): Promise<void> {
    if (!this.botConfig.adminReviewsChat) { return; }

    let text = `*${this.escapeString(review.name)}* оставил\\(а\\) отзыв о магазине\n`
      + `Оценка: *${review.rating}*\n`
      + `Откуда: *${this.escapeString(review.source)}*\n`;

    if (review.medias.length) {
      text += `Кол\\-во фото: *${review.medias.length}*\n`;
    }
    text += `\n_${this.escapeString(review.text)}_`;

    const reply: ITelegramInlineKeyboardMarkup = {
      inline_keyboard: [[{
        text: 'Посмотреть в админке',
        url: this.getFrontendUrl('store-review', review.id)
      }]]
    };

    this.telegramApiService.sendMessage(this.botConfig.adminReviewsChat, text, reply);
  }

  async onInternalServerError(error: any) {
    if (!isProdEnv()) {
      return;
    }

    const str = JSON.stringify(error, null, 2);
    const toEscape = ['`', '\\'];
    let escapedStr: string = '';
    for (const strElement of str) {
      if (toEscape.includes(strElement)) {
        escapedStr += String.fromCharCode(92);
      }

      escapedStr += strElement;
    }

    const message = '```json\n'
      + escapedStr
      + '\n```';

    this.telegramApiService.sendMessage(this.botConfig.adminHealthChat, message);
  }

  async onNewPayment(payment: IPayment): Promise<void> {
    let message = `*${this.escapeString(payment.amount)} грн*\n`
      + `${this.escapeString(payment.description)}\n`;

    if (payment.comment) {
      message += `_${this.escapeString(payment.comment)}_\n`
    }

    message += `Баланс: ${this.escapeString(payment.balance)} грн\n`
      + `${payment.source}`;

    this.telegramApiService.sendMessage(this.botConfig.adminPaymentChat, message);
  }

  async onCommand(chat: ITelegramChat, commandText: string, user: ITelegramUser): Promise<void> {
    commandText = this.normalizeCommand(commandText);

    switch (commandText) {
      case BotCommand.GetBalance:
        this.sendBalance(chat, user);
        break;
      default:
        this.botConfig.onCommand(chat, commandText, user);
        break;
    }
  }

  private async sendBalance(chat: ITelegramChat, user: ITelegramUser): Promise<void> {
    let message: string;
    try {
      const monobankBalance = await this.monobankConnector.getBalance();
      const privatbankBalance = await this.privatbankConnector.getBalance();

      message = `Монобанк: *${this.escapeString(monobankBalance)} грн*\n`
        + `Приватбанк: *${this.escapeString(privatbankBalance)} грн*`;
    } catch (e) {
      message = e;
    }

    this.telegramApiService.sendMessage(chat.id, message);
  }

  private escapeString(str: string): string {
    if (!str) { str = ''; }

    const toEscape = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!' ];
    let escapedStr: string = '';
    for (const strElement of str) {
      if (toEscape.includes(strElement)) {
        escapedStr += String.fromCharCode(92);
      }

      escapedStr += strElement;
    }

    return escapedStr;
  }

  private getFrontendUrl(type: 'order' | 'store-review' | 'product-review' | 'product', postfix: string | number = ''): string {
    const host = `https://klondike.com.ua`;
    const adminPrefix = `/admin`;

    let url = host + adminPrefix;
    switch (type) {
      case 'order':
        url += `/order/view/`;
        break;
      case 'store-review':
        url += `/store-review/edit/`;
        break;
      case 'product-review':
        url += `/product-review/edit/`;
        break;
      case 'product':
        url += `/product/edit/`;
        break;
    }

    return url + postfix;
  }

  private normalizeCommand(commandText: string): string {
    const indexOfBotMention = commandText.indexOf(`@${this.botConfig.botUsername}`);
    if (indexOfBotMention > -1) {
      commandText = commandText.slice(0, indexOfBotMention);
    }

    return commandText;
  }
}
