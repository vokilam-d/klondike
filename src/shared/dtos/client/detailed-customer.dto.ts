import { ClientCustomerDto } from './customer.dto';
import { Customer } from '../../../customer/models/customer.model';
import { Expose, Type } from 'class-transformer';
import { ShipmentAddressDto } from '../shared-dtos/shipment-address.dto';

export class ClientDetailedCustomerDto extends ClientCustomerDto implements Pick<Customer, 'addresses' | 'isEmailConfirmed' | 'totalOrdersCount' | 'totalOrdersCost' | 'discountPercent' | 'orderIds' | 'reviewIds' | 'wishlistProductIds'> {

  @Expose()
  @Type(() => ShipmentAddressDto)
  addresses: ShipmentAddressDto[];

  @Expose()
  isEmailConfirmed: boolean;

  @Expose()
  totalOrdersCount: number;

  @Expose()
  totalOrdersCost: number;

  @Expose()
  discountPercent: number;

  @Expose()
  orderIds: number[];

  @Expose()
  reviewIds: number[];

  @Expose()
  wishlistProductIds: number[];
}
