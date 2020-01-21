import { Expose } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AdminOrderItemDto {
  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsNumber()
  productId: number;

  @Expose()
  @IsString()
  variantId: string;

  @Expose()
  @IsString()
  sku: string;

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
  discountValue: number;

  @Expose()
  @IsNumber()
  totalCost: number;

  @Expose()
  @IsOptional()
  @IsString()
  imageUrl: string;
}
