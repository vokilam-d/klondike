import { Expose, Type } from 'class-transformer';
import { BaseOrderItemAdditionalServiceDto } from '../shared-dtos/base-order-item-additional-service.dto';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';

export class AdminOrderItemAdditionalServiceDto extends BaseOrderItemAdditionalServiceDto {
  @Expose()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;
}
