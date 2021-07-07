import { Injectable, Logger } from '@nestjs/common';
import { TaxShiftDto } from '../../shared/dtos/admin/tax/tax-shift.dto';
import { TaxReceiptDto } from '../../shared/dtos/admin/tax/tax-receipt.dto';
import { TaxReceiptSellDto } from '../../shared/dtos/admin/tax/tax-receipt-sell.dto';
import { CheckboxConnector } from './checkbox.connector';
import { OrderService } from '../../order/services/order.service';
import { Language } from '../../shared/enums/language.enum';
import { TaxPaymentType } from '../../shared/enums/tax/tax-payment-type.enum';
import { TaxDiscountType } from '../../shared/enums/tax/tax-discount-type.enum';
import { TaxDiscountMode } from '../../shared/enums/tax/tax-discount-mode.enum';
import { Subject } from 'rxjs';
import { DocumentType } from '@typegoose/typegoose';
import { Order } from '../../order/models/order.model';
import { User } from '../../user/models/user.model';
import { TaxCashRegisterDeviceDto } from '../../shared/dtos/admin/tax/tax-cash-register-device.dto';

@Injectable()
export class TaxService {

  newReceipt$: Subject<{ receipt: TaxReceiptDto, order: DocumentType<Order>, user: User }> = new Subject();

  private delay: number = 3000;
  private readonly logger = new Logger(TaxService.name);

  constructor(
    private readonly taxAuthorityProvider: CheckboxConnector,
    private readonly orderService: OrderService
  ) { }

  async getCurrentShift(): Promise<TaxShiftDto> {
    return this.taxAuthorityProvider.getCurrentShift();
  }

  async openShift(user: User): Promise<TaxShiftDto> {
    const shift = await this.taxAuthorityProvider.openShift();
    setTimeout(() => this.ensureOnlineMode(), this.delay);

    this.logger.log(`Initiated shift opening, shiftId=${shift.id}, userLogin=${user?.login}`);
    return shift;
  }

  async closeShift(user: User): Promise<TaxShiftDto> {
    const shift = await this.taxAuthorityProvider.closeShift();
    this.logger.log(`Initiated shift closing, shiftId=${shift.id}, userLogin=${user?.login}`);
    return shift;
  }

  async getReceipt(id: string): Promise<TaxReceiptDto> {
    return this.taxAuthorityProvider.getReceipt(id);
  }

  async createReceipt(orderId: string, lang: Language, user: User): Promise<TaxReceiptDto> {
    const order = await this.orderService.getOrderById(parseInt(orderId), lang);

    const createReceiptDto: TaxReceiptSellDto = {
      header: `Замовлення №${order.idForCustomer}`,
      footer: `Інтернет-магазин Клондайк`,
      delivery: { emails: [] },
      goods: order.items.map(item => ({
        quantity: item.qty * 1000,
        good: {
          code: item.sku,
          name: item.name[Language.UK],
          price: this.normalizePrice(item.price)
        }
      })),
      payments: [{
        type: TaxPaymentType.CASHLESS,
        value: this.normalizePrice(order.prices.totalCost)
      }],
      discounts: []
    };

    if (order.prices.discountValue) {
      createReceiptDto.discounts.push({
        type: TaxDiscountType.DISCOUNT,
        mode: TaxDiscountMode.VALUE,
        value: this.normalizePrice(order.prices.discountValue)
      });
    }

    const receipt: TaxReceiptDto = await this.taxAuthorityProvider.createReceipt(createReceiptDto);

    setTimeout(() => this.ensureOnlineMode(), this.delay);

    this.newReceipt$.next({ receipt, order, user });
    this.logger.log(`Initiated receipt fiscalization, receiptId=${order.receiptId}, orderId=${order.id}, userLogin=${user?.login}`);
    return receipt;
  }

  private async ensureOnlineMode(isRetry: boolean = false) {
    let cashRegisterInfo: TaxCashRegisterDeviceDto;
    try {
      cashRegisterInfo = await this.taxAuthorityProvider.getCashRegisterInfo();
    } catch (e) {
      return;
    }

    if (cashRegisterInfo.offline_mode === false) {
      if (isRetry) {
        this.logger.log(`Set cash register to "online" mode`);
      }
      return;
    }

    await this.taxAuthorityProvider.goOnline().catch(() => {});

    this.logger.warn(`Trying to ensure cash register "online" mode in ${this.delay / 1000}s...`);
    setTimeout(() => this.ensureOnlineMode(true), this.delay);
  }

  /**
   * Adds cents to price value
   */
  private normalizePrice(price: number): number {
    return price * 100;
  }
}
