import { prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

export class BackendCartedInventory {
  @prop()
  qty: number;

  @prop()
  cartId: Types.ObjectId;

  @prop()
  timestamp: any;
}
