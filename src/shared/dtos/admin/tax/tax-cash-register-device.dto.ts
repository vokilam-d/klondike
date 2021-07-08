export class TaxCashRegisterDeviceDto {
  id: string;
  fiscal_number: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  title: string;
  offline_mode: boolean;
  stay_offline: boolean;
  has_shift: boolean;
  documents_state: {
    last_receipt_code: number;
    last_report_code: number;
    last_z_report_code: number;
  };
}
