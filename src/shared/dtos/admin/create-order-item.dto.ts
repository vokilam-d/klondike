import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';

export class AdminCreateOrderItemDto {
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
