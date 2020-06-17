import { Expose, Type } from 'class-transformer';
import { Customer } from '../../../customer/models/customer.model';
import { OrderItemDto } from '../shared-dtos/order-item.dto';
import { ShipmentAddressDto } from '../shared-dtos/shipment-address.dto';

export class ClientCustomerDto implements Pick<Customer, 'id' | 'firstName' | 'lastName' | 'email' | 'phoneNumber' | 'cart' | 'addresses' | 'isEmailConfirmed' | 'totalOrdersCount' | 'totalOrdersCost' | 'discountPercent' | 'orderIds' | 'reviewIds' | 'wishlistProductIds'> {
  @Expose()
  id: number;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  phoneNumber: string;

  @Expose()
  cart: OrderItemDto[];

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
