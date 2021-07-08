import { TaxShortTransactionDto } from './tax-short-transaction.dto';
import { TaxReceiptType } from '../../../enums/tax/tax-receipt-type.enum';
import { TaxReceiptStatus } from '../../../enums/tax/tax-receipt-status.enum';
import { TaxGoodItemDto } from './tax-good-item.dto';
import { TaxCashPaymentPayloadDto } from './tax-cash-payment-payload.dto';
import { TaxCardPaymentPayloadDto } from './tax-card-payment-payload.dto';
import { TaxGoodTaxDto } from './tax-good-tax.dto';
import { TaxDiscountDto } from './tax-discount.dto';
import { TaxShiftDto } from './tax-shift.dto';

export class TaxReceiptDto {
  id: string;
  type: TaxReceiptType;
  transaction: TaxShortTransactionDto;
  serial: number;
  status: TaxReceiptStatus;
  goods: TaxGoodItemDto;
  payments: (TaxCardPaymentPayloadDto | TaxCashPaymentPayloadDto)[];
  total_sum: number;
  total_payment: number;
  total_rest: number;
  fiscal_code: string;
  fiscal_date: string;
  delivered_at: string;
  created_at: string;
  updated_at: string;
  taxes: TaxGoodTaxDto[];
  discounts: TaxDiscountDto[];
  header: string;
  footer: string;
  barcode: string;
  is_created_offline: false;
  is_sent_dps: false;
  sent_dps_at: string;
  tax_url: string;
  related_receipt_id: string;
  technical_return: false;
  currency_exchange: null;
  shift: TaxShiftDto;

  // custom transforms
  textRepresentation?: string;
  pdfUrl?: any;
}
