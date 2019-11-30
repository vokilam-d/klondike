import { BackendCartItemDetails } from './cart-item-details.model';
import { prop } from '@typegoose/typegoose';

export class BackendCartItem {

  @prop()
  sku: string;

  @prop()
  qty: number;

  @prop()
  details: BackendCartItemDetails;
}
