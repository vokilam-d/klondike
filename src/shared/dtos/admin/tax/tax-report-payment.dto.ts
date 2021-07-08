import { TaxPaymentType } from '../../../enums/tax/tax-payment-type.enum';

export class TaxReportPaymentDto {
  id: string;
  code: number;
  type: TaxPaymentType;
  label: string;
  sell_sum: number;
  return_sum: number;
  service_in: number;
  service_out: number;
}
