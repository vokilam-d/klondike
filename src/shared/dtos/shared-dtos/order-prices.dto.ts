import { OrderPrices } from '../../models/order-prices.model';
import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class OrderPricesDto implements OrderPrices {
  @Expose()
  @IsNumber()
  discountPercent: number;

  @Expose()
  @IsNumber()
  discountValue: number;

  @Expose()
  @IsString()
  discountLabel: string;

  @Expose()
  @IsNumber()
  itemsCost: number;

  @Expose()
  @IsNumber()
  totalCost: number;
}
