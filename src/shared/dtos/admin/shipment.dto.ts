import { BaseShipmentDto } from '../shared-dtos/base-shipment.dto';
import { Expose } from 'class-transformer';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';

export class AdminShipmentDto extends BaseShipmentDto {
  @Expose()
  shippingMethodDescription: MultilingualTextDto;
}
