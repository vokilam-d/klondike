export class TaxShiftTaxDto {
  id: string;
  code: number;
  label: string;
  symbol: string;
  rate: number;
  extra_rate: number;
  included: boolean;
  created_at: string;
  updated_at: string;
  sales: number;
  returns: number;
  sales_turnover: number;
  returns_turnover: number;
}
