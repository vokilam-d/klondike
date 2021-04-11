import { prop } from '@typegoose/typegoose';
import { ContactInfo } from '../../shared/models/contact-info.model';

export class OrderContactInfo extends ContactInfo {
  @prop()
  email: string;
}
