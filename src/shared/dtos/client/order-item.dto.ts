import { IsNumber, IsPositive, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';

export class ClientAddOrUpdateOrderItemDto {
  @IsString()
  @TrimString()
  sku: string;

  @IsNumber()
  @IsPositive()
  qty: number;
}
