import { BaseShipmentDto } from '../shared-dtos/base-shipment.dto';
import { Expose, Type } from 'class-transformer';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';

export class AdminShipmentDto extends BaseShipmentDto {
  @Expose()
  @Type(() => MultilingualTextDto)
  shippingMethodDescription: MultilingualTextDto;
}
