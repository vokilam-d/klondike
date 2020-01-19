import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateOrderItemDto {
  @IsString()
  sku: string;

  @IsNumber()
  @IsPositive()
  qty: number;

  @IsNumber()
  @IsOptional()
  customerId: number;
}
