import { BaseOrderItemDto } from '../shared-dtos/base-order-item.dto';
import { Expose, Type } from 'class-transformer';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';
import { AdminOrderItemAdditionalServiceDto } from './order-item-additional-service.dto';

export class AdminOrderItemDto extends BaseOrderItemDto {
  @Expose()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;

  @Expose()
  @Type(() => AdminOrderItemAdditionalServiceDto)
  additionalServices: AdminOrderItemAdditionalServiceDto[];
}
