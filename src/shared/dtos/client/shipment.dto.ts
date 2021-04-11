import { BaseShipmentDto } from '../shared-dtos/base-shipment.dto';
import { Expose, plainToClass } from 'class-transformer';
import { Shipment } from '../../../order/models/shipment.model';
import { Language } from '../../enums/language.enum';

export class ClientShipmentDto extends BaseShipmentDto {
  @Expose()
  shippingMethodDescription: string;

  static transformToDto(shipment: Shipment, lang: Language): ClientShipmentDto {
    return {
      ...plainToClass(Shipment, shipment, { excludeExtraneousValues: true }),
      shippingMethodDescription: shipment.shippingMethodDescription[lang]
    };
  }
}
