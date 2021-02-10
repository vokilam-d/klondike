import { prop } from '@typegoose/typegoose';

export class LinkedProduct {
  @prop({ required: true })
  productId: number;

  @prop()
  variantId: string;

  @prop({ default: 0 })
  sortOrder: number;
}
