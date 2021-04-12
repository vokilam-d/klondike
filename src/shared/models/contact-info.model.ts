import { prop } from '@typegoose/typegoose';

export class ContactInfo {
  @prop({ default: '' })
  lastName: string;

  @prop({ default: '' })
  firstName: string;

  @prop({ required: false, default: '' })
  middleName?: string;

  @prop({ index: true, default: '' })
  phoneNumber: string;
}
