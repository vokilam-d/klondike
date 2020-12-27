import { Expose, Type } from 'class-transformer';
import { Customer } from '../../../customer/models/customer.model';
import { ShipmentAddressDto } from '../shared-dtos/shipment-address.dto';
import { ClientOrderItemDto } from './order-item.dto';

export class ClientCustomerDto implements
  Pick<Customer, 'id' | 'firstName' | 'lastName' | 'email' | 'phoneNumber' | 'addresses' | 'isEmailConfirmed' | 'totalOrdersCount' | 'totalOrdersCost' | 'discountPercent' | 'orderIds' | 'reviewIds' | 'wishlistProductIds'>,
  Record<keyof Pick<Customer, 'cart'>, ClientOrderItemDto[]> {
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
  cart: ClientOrderItemDto[];

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
