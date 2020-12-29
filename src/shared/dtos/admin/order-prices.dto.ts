import { BaseOrderPricesDto } from '../shared-dtos/base-order-prices.dto';
import { Expose, Type } from 'class-transformer';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';

export class AdminOrderPricesDto extends BaseOrderPricesDto {
  @Expose()
  @Type(() => MultilingualTextDto)
  discountLabel: MultilingualTextDto;
}
