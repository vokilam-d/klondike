import { TaxPaymentType } from '../../../enums/tax/tax-payment-type.enum';

export class TaxCashPaymentPayloadDto {
  type: TaxPaymentType.CASH;
  value: number;
  label?: string;
}
