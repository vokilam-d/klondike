import { prop } from '@typegoose/typegoose';

export class LinkedProduct {
  @prop({ required: true })
  productId: number;

  @prop({ required: true })
  variantId: string;

  @prop({ default: 0 })
  sortOrder: number;
}
