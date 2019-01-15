import { ICartItemDetails } from '../../../../shared/models/cart.interface';
import { prop } from 'typegoose';

export class CartItemDetails implements ICartItemDetails {
  @prop()
  name: string;
}