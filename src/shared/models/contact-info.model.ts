import { prop } from '@typegoose/typegoose';

export class ContactInfo {
  @prop()
  lastName: string;

  @prop()
  firstName: string;

  @prop({ required: false })
  middleName?: string;

  @prop()
  phoneNumber: string;
}
