import { prop } from '@typegoose/typegoose';

export class ReservedInventory {
  @prop({ min: 1 })
  qty: number;

  @prop()
  orderId: number;

  @prop()
  timestamp: any;
}
