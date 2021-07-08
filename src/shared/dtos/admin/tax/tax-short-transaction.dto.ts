import { TaxTransactionType } from '../../../enums/tax/tax-transaction-type.enum';
import { TaxTransactionStatus } from '../../../enums/tax/tax-transaction-status.enum';

export class TaxShortTransactionDto {
  id: string;
  type: TaxTransactionType;
  serial: number;
  status: TaxTransactionStatus;
  request_signed_at: string;
  request_received_at: string;
  response_status: string;
  response_error_message: string;
  response_id: string;
  offline_id: string;
  created_at: string;
  updated_at: string;
  previous_hash: string;
}
