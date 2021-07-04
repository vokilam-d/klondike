export class TaxGoodPayloadDto {
  code: string;
  name: string;
  barcode?: string;
  header?: string;
  footer?: string;
  price: number;
  tax?: any[];
  uktzed?: string;
}
