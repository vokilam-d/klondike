export class TaxValidationErrorDto {
  message: string;
  detail: {
    loc: string[];
    msg: string;
    type: string;
  }[];
}
