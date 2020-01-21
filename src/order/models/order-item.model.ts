import { prop } from '@typegoose/typegoose';

export class OrderItem {
  @prop()
  name: string;

  @prop()
  productId: number;

  @prop()
  variantId: string;

  @prop()
  sku: string;

  @prop()
  originalPrice: number;

  @prop()
  price: number;

  @prop()
  qty: number;

  @prop()
  cost: number;

  @prop()
  discountValue: number;

  @prop()
  totalCost: number;

  @prop()
  imageUrl: string;
}
