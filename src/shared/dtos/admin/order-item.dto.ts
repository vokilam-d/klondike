import { BaseOrderItemDto } from '../shared-dtos/base-order-item.dto';
import { Expose, Type } from 'class-transformer';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';
import { AdminOrderItemAdditionalServiceDto } from './order-item-additional-service.dto';
import { OrderItem } from '../../../order/models/order-item.model';

export class AdminOrderItemDto extends BaseOrderItemDto implements Pick<OrderItem, 'isPacked'>{
  @Expose()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;

  @Expose()
  @Type(() => AdminOrderItemAdditionalServiceDto)
  additionalServices: AdminOrderItemAdditionalServiceDto[];

  @Expose()
  isPacked: boolean;
}
