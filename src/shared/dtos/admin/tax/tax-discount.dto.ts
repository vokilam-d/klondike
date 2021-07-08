import { TaxDiscountType } from '../../../enums/tax/tax-discount-type.enum';
import { TaxDiscountMode } from '../../../enums/tax/tax-discount-mode.enum';

export class TaxDiscountDto {
  type: TaxDiscountType;
  mode: TaxDiscountMode;
  value: number;
  sum: number;
  tax_code?: string | number;
  tax_codes?: (string | number)[];
  name?: string;
}
