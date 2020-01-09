import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class AdminOrderItemDto {
  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsNumber()
  originalPrice: number;

  @Expose()
  @IsNumber()
  price: number;

  @Expose()
  @IsNumber()
  qty: number;

  @Expose()
  @IsNumber()
  cost: number;

  @Expose()
  @IsNumber()
  discountAmountInPercent: number;

  @Expose()
  @IsNumber()
  totalPrice: number;
}
