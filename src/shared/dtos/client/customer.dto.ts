import { Expose } from 'class-transformer';
import { Customer } from '../../../customer/models/customer.model';

export class ClientCustomerDto implements Pick<Customer, 'id' | 'firstName' | 'lastName' | 'email' | 'phoneNumber'> {
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
}
