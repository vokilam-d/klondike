import { Customer } from '../../../customer/models/customer.model';
import { IsEmail, IsString } from 'class-validator';

export class ClientUpdateCustomerDto implements Pick<Customer, 'firstName' | 'lastName' | 'email'>{
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;
}
