import { BaseOrderItemDto } from '../shared-dtos/base-order-item.dto';
import { Expose, Type } from 'class-transformer';
import { ClientOrderItemAdditionalServiceDto } from './order-item-additional-service.dto';

export class ClientOrderItemDto extends BaseOrderItemDto {
  @Expose()
  name: string;

  @Expose()
  @Type(() => ClientOrderItemAdditionalServiceDto)
  additionalServices: ClientOrderItemAdditionalServiceDto[];
}
