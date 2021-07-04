import { TaxReportPaymentDto } from './tax-report-payment.dto';
import { TaxDto } from './tax.dto';

export class TaxReportDto {
  id: string;
  serial: number;
  is_z_report: boolean;
  payments: TaxReportPaymentDto[];
  taxes: TaxDto[];
  sell_receipts_count: number;
  return_receipts_count: number;
  transfers_count: number;
  transfers_sum: number;
  balance: number;
  initial: number;
  created_at: string;
  updated_at: string;
}
