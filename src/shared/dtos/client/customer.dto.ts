import { Expose } from 'class-transformer';
import { Customer } from '../../../customer/models/customer.model';
import { OrderItemDto } from '../shared-dtos/order-item.dto';

export class ClientCustomerDto implements Pick<Customer, 'id' | 'firstName' | 'lastName' | 'email' | 'phoneNumber' | 'cart'> {
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
}
