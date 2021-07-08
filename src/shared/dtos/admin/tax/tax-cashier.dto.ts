import { TaxSignatureType } from '../../../enums/tax/tax-signature-type.enum';

export class TaxCashierDto {
  id: string;
  full_name: string;
  nin: string;
  key_id: string;
  signature_type: TaxSignatureType;
  permissions: {
    orders: false
  };
  created_at: string;
  updated_at: string;
}
