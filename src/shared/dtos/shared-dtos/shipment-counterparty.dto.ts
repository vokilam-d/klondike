import { ContactInfoDto } from './contact-info.dto';
import { Expose, Type } from 'class-transformer';
import { ShipmentAddressDto } from './shipment-address.dto';

export class ShipmentCounterpartyDto {
  @Expose()
  @Type(() => ContactInfoDto)
  contactInfo: ContactInfoDto;

  @Expose()
  @Type(() => ShipmentAddressDto)
  address: ShipmentAddressDto;
}
