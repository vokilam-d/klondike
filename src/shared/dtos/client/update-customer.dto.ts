import { Customer } from '../../../customer/models/customer.model';
import { IsEmail, IsString, ValidateNested } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';
import { Type } from 'class-transformer';
import { CustomerContactInfoDto } from '../shared-dtos/customer-contact-info.dto';

export class ClientUpdateCustomerDto implements Pick<Customer, 'contactInfo'> {
  @ValidateNested()
  @Type(() => CustomerContactInfoDto)
  contactInfo: CustomerContactInfoDto;
}
