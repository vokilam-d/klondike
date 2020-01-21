import { prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

export class OrderedInventory {
  @prop({ min: 1 })
  qty: number;

  @prop()
  orderId: number;

  @prop()
  timestamp: any;
}
