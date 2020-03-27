import { IsNumber, IsPositive, IsString } from 'class-validator';

export class ClientAddOrUpdateOrderItemDto {
  @IsString()
  sku: string;

  @IsNumber()
  @IsPositive()
  qty: number;
}
