import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class AdminCreateOrderItemDto {
  @IsString()
  sku: string;

  @IsNumber()
  @IsPositive()
  qty: number;

  @IsNumber()
  @IsOptional()
  customerId: number;
}
