import { ContactInfoDto } from './contact-info.dto';
import { Expose } from 'class-transformer';
import { ShipmentAddressDto } from './shipment-address.dto';

export class ShipmentCounterpartyDto {
  @Expose()
  contactInfo: ContactInfoDto;

  @Expose()
  address: ShipmentAddressDto;
}
