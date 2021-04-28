import { ContactInfoDto } from './contact-info.dto';
import { Expose, Type } from 'class-transformer';
import { ShipmentAddressDto } from './shipment-address.dto';
import { ShipmentCounterparty } from '../../models/shipment-counterparty.model';

export class ShipmentCounterpartyDto implements ShipmentCounterparty {
  @Expose()
  id?: string;

  @Expose()
  @Type(() => ContactInfoDto)
  contactInfo: ContactInfoDto;

  @Expose()
  @Type(() => ShipmentAddressDto)
  address: ShipmentAddressDto;
}
