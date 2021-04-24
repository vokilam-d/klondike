import { ShipmentAddress } from '../models/shipment-address.model';

export function areAddressesSame(address1: ShipmentAddress, address2: ShipmentAddress): boolean {
  return address1.type === address2.type
    && address1.settlementId === address2.settlementId
    && address1.addressId === address2.addressId
    && address1.flat === address2.flat
    && address1.buildingNumber === address2.buildingNumber;
}
