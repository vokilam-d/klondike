import { TaxPaymentType } from '../../../enums/tax/tax-payment-type.enum';

export class TaxCardPaymentPayloadDto {
  type: TaxPaymentType.CASHLESS;
  code?: number;
  value: number;
  label?: string;
  card_mask?: string;
  bank_name?: string;
  auth_code?: string;
  rrn?: string;
  payment_system?: string;
  owner_name?: string;
  terminal?: string;
  acquiring?: string;
  receipt_no?: string;
  signature_required?: string;
}
