import { prop } from '@typegoose/typegoose';
import { ContactInfo } from '../../shared/models/contact-info.model';

export class CustomerContactInfo extends ContactInfo {
  @prop({ index: true, default: '' })
  email: string;
}
