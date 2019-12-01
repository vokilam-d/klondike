import { CartItemDetails } from './cart-item-details.model';
import { prop } from '@typegoose/typegoose';

export class CartItem {

  @prop()
  sku: string;

  @prop()
  qty: number;

  @prop()
  details: CartItemDetails;
}
