import { ClientCustomerDto } from './customer.dto';
import { Customer } from '../../../customer/models/customer.model';
import { ShippingAddressDto } from '../shared-dtos/shipping-address.dto';
import { Expose, Type } from 'class-transformer';

export class ClientDetailedCustomerDto extends ClientCustomerDto implements Pick<Customer, 'addresses' | 'isEmailConfirmed' | 'totalOrdersCount' | 'totalOrdersCost' | 'discountPercent' | 'orderIds' | 'reviewIds' | 'wishlistProductIds'> {

  @Expose()
  @Type(() => ShippingAddressDto)
  addresses: ShippingAddressDto[];

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
