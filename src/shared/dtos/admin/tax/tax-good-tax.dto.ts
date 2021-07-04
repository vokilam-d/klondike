export class TaxGoodTaxDto {
  id: string;
  code: number;
  label: string;
  symbol: string;
  rate: number;
  extra_rate?: number;
  included: boolean;
  created_at: string;
  updated_at?: string;
  value: number;
  extra_value: number;
}
