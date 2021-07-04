import { TaxGoodPayloadDto } from './tax-good-payload.dto';
import { TaxDiscountPayloadDto } from './tax-discount-payload.dto';

export class TaxGoodItemPayloadDto {
  good: TaxGoodPayloadDto;
  good_id?: string;
  quantity: number;
  is_return?: boolean;
  discounts: TaxDiscountPayloadDto[];
}
