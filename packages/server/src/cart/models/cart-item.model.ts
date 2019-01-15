import { ICartItem } from '../../../../shared/models/cart.interface';
import { CartItemDetails } from './cart-item-details.model';
import { prop } from 'typegoose';

export class CartItem implements ICartItem {

  @prop()
  sku: string;

  @prop()
  qty: number;

  @prop()
  details: CartItemDetails;
}