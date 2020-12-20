import { BaseOrderPricesDto } from '../shared-dtos/base-order-prices.dto';
import { Expose } from 'class-transformer';

export class ClientOrderPricesDto extends BaseOrderPricesDto {
  @Expose()
  discountLabel: string;
}
