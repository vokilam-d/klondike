import { OrderItemDto } from '../shared-dtos/order-item.dto';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class ClientCalculatePricesDto {
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
