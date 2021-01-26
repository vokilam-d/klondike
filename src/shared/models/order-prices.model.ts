import { prop } from '@typegoose/typegoose';

export class OrderPrices {
  @prop()
  itemsCost: number;

  @prop()
  discountValue: number;

  @prop()
  totalCost: number;
}
