import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';
import { ContactInfoDto } from './contact-info.dto';
import { CustomerContactInfo } from '../../../order/models/customer-contact-info.model';

export class CustomerContactInfoDto extends ContactInfoDto implements CustomerContactInfo {
  @Expose()
  @IsString()
  @TrimString()
  email: string;
}
