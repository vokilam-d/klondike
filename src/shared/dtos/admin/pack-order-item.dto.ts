import { IsNumber, IsString, Min } from 'class-validator';

export class PackOrderItemDto {
  @IsString()
  sku: string;

  @IsNumber()
  @Min(1)
  qty: number;
}
