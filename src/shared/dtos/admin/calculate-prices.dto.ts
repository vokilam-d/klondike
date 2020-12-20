import { Type } from 'class-transformer';
import { IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { AdminOrderItemDto } from './order-item.dto';

export class AdminCalculatePricesDto {
  @ValidateNested({ each: true })
  @Type(() => AdminOrderItemDto)
  items: AdminOrderItemDto[];

  @IsOptional()
  @IsNumber()
  customerId: number;
}
