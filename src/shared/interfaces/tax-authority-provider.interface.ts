import { TaxShiftDto } from '../dtos/admin/tax/tax-shift.dto';
import { TaxReceiptDto } from '../dtos/admin/tax/tax-receipt.dto';
import { TaxReceiptSellDto } from '../dtos/admin/tax/tax-receipt-sell.dto';
import { TaxCashRegisterDeviceDto } from '../dtos/admin/tax/tax-cash-register-device.dto';

export interface ITaxAuthorityProvider {
  getCurrentShift(): Promise<TaxShiftDto>;

  openShift(): Promise<TaxShiftDto>;

  closeShift(): Promise<TaxShiftDto>;

  getReceipt(id: string): Promise<TaxReceiptDto>;

  createReceipt(createReceiptDto: TaxReceiptSellDto): Promise<TaxReceiptDto>;

  getCashRegisterInfo(): Promise<TaxCashRegisterDeviceDto>;

  goOnline(): Promise<any>;

  goOffline(): Promise<any>;
}
