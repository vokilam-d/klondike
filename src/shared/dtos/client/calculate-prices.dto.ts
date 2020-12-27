import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { ClientOrderItemDto } from './order-item.dto';

export class ClientCalculatePricesDto {
  @ValidateNested({ each: true })
  @Type(() => ClientOrderItemDto)
  items: ClientOrderItemDto[];
}
