import { Expose } from 'class-transformer';
import { BaseOrderItemAdditionalServiceDto } from '../shared-dtos/base-order-item-additional-service.dto';

export class ClientOrderItemAdditionalServiceDto extends BaseOrderItemAdditionalServiceDto {
  @Expose()
  name: string;
}
