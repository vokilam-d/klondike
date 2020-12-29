import { Customer } from '../../../customer/models/customer.model';
import { IsEmail, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';

export class ClientUpdateCustomerDto implements Pick<Customer, 'firstName' | 'lastName' | 'email'> {
  @IsString()
  @TrimString()
  firstName: string;

  @IsString()
  @TrimString()
  lastName: string;

  @IsEmail()
  email: string;
}
