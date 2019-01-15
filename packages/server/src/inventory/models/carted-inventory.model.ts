import { prop } from 'typegoose';
import { ICartedInventory } from '../../../../shared/models/inventory.interface';
import { Types } from 'mongoose';

export class CartedInventory {
  @prop()
  qty: number;

  @prop()
  cartId: Types.ObjectId;

  @prop()
  timestamp: any;
}