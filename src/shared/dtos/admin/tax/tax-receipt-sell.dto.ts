import { TaxGoodPayloadDto } from './tax-good-payload.dto';
import { TaxGoodItemPayloadDto } from './tax-good-item-payload.dto';
import { TaxDiscountPayloadDto } from './tax-discount-payload.dto';
import { TaxCardPaymentPayloadDto } from './tax-card-payment-payload.dto';
import { TaxCashPaymentPayloadDto } from './tax-cash-payment-payload.dto';

export class TaxReceiptSellDto {
  id?: string;
  cashier_name?: string;
  departament?: string;
  goods: TaxGoodItemPayloadDto[];
  delivery: {
    emails: string[];
  };
  discounts: TaxDiscountPayloadDto[];
  payments: (TaxCardPaymentPayloadDto | TaxCashPaymentPayloadDto)[];
  rounding?: boolean;
  header?: string;
  footer?: string;
  barcode?: string;
  order_id?: string;
  related_receipt_id?: string;
  previous_receipt_id?: string;
  technical_return?: false;
}
