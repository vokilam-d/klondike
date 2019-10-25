import { prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

export class CartedInventory {
  @prop()
  qty: number;

  @prop()
  cartId: Types.ObjectId;

  @prop()
  timestamp: any;
}
