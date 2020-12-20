import { OrderPrices } from '../../models/order-prices.model';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export abstract class BaseOrderPricesDto implements OrderPrices {
  @Expose()
  @IsNumber()
  discountPercent: number;

  @Expose()
  @IsNumber()
  discountValue: number;

  abstract discountLabel: any;

  @Expose()
  @IsNumber()
  itemsCost: number;

  @Expose()
  @IsNumber()
  totalCost: number;
}
