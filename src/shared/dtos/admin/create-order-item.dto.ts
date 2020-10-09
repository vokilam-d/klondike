import { IsNumber, IsPositive, IsString } from 'class-validator';

export class AdminCreateOrderItemDto {
  @IsString()
  sku: string;

  @IsNumber()
  @IsPositive()
  qty: number;
}
