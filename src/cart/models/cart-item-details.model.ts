import { prop } from '@typegoose/typegoose';

export class CartItemDetails {
  @prop()
  name: string;
}
