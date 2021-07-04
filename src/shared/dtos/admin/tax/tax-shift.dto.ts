import { TaxReportDto } from './tax-report.dto';
import { TaxShortTransactionDto } from './tax-short-transaction.dto';
import { TaxBalanceDto } from './tax-balance.dto';
import { TaxShiftTaxDto } from './tax-shift-tax.dto';
import { TaxCashRegisterDto } from './tax-cash-register.dto';
import { TaxCashierDto } from './tax-cashier.dto';
import { TaxShiftStatus } from '../../../enums/tax/tax-shift-status.enum';

export class TaxShiftDto {
  id: string;
  serial: 0;
  status: TaxShiftStatus;
  z_report: TaxReportDto;
  opened_at: string;
  closed_at: string;
  initial_transaction: TaxShortTransactionDto;
  closing_transaction: TaxShortTransactionDto;
  created_at: string;
  updated_at: string;
  balance: TaxBalanceDto;
  taxes: TaxShiftTaxDto[];
  cash_register: TaxCashRegisterDto;
  cashier: TaxCashierDto;
}
