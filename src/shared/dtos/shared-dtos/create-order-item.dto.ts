import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';
import { BaseOrderItemDto } from './base-order-item.dto';

export class CreateOrderItemDto implements Pick<BaseOrderItemDto, 'sku' | 'qty'> {
  @IsString()
  @TrimString()
  sku: string;

  @IsNumber()
  @IsPositive()
  qty: number;

  @IsNumber(undefined, { each: true })
  @IsOptional()
  additionalServiceIds: number[];
}
