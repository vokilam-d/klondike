import { prop } from '@typegoose/typegoose';

export class OrderNotes {
  @prop()
  fromCustomer: string;

  @prop()
  fromAdmin: string;

  @prop()
  aboutCustomer: string;
}
