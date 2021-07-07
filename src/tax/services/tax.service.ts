import { Injectable } from '@nestjs/common';
import { TaxShiftDto } from '../../shared/dtos/admin/tax/tax-shift.dto';
import { TaxReceiptDto } from '../../shared/dtos/admin/tax/tax-receipt.dto';
import { TaxReceiptSellDto } from '../../shared/dtos/admin/tax/tax-receipt-sell.dto';
import { CheckboxConnector } from './checkbox.connector';

@Injectable()
export class TaxService {

  constructor(
    private readonly checkboxConnector: CheckboxConnector
  ) { }

  async getCurrentShift(): Promise<TaxShiftDto> {
    return this.checkboxConnector.getCurrentShift();
  }

  async openShift(): Promise<TaxShiftDto> {
    return this.checkboxConnector.openShift();
  }

  async closeShift(): Promise<TaxShiftDto> {
    return this.checkboxConnector.closeShift();
  }

  async getReceipt(id: string): Promise<TaxReceiptDto> {
    return this.checkboxConnector.getReceipt(id);
  }

  async createReceipt(createReceiptDto: TaxReceiptSellDto): Promise<TaxReceiptDto> {
    return this.checkboxConnector.createReceipt(createReceiptDto);
  }
}
