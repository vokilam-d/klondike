import { TaxGoodDto } from './tax-good.dto';
import { TaxDiscountDto } from './tax-discount.dto';

export class TaxGoodItemDto {
  good: TaxGoodDto;
  good_id?: string;
  sum: string;
  quantity: number;
  is_return: boolean;
  discounts: TaxDiscountDto[];
}
