import { prop } from '@typegoose/typegoose';
import { MultilingualText } from './multilingual-text.model';

export class OrderPrices {
  @prop()
  itemsCost: number;

  @prop()
  discountPercent: number;

  @prop()
  discountLabel: MultilingualText;

  @prop()
  discountValue: number;

  @prop()
  totalCost: number;
}
