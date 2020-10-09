import { prop } from '@typegoose/typegoose';

export class OrderPrices {
  @prop()
  itemsCost: number;

  @prop()
  discountPercent: number;

  @prop()
  discountLabel: string;

  @prop()
  discountValue: number;

  @prop()
  totalCost: number;
}
