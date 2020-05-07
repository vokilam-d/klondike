import { prop } from '@typegoose/typegoose';

export class LinkedProduct {
  @prop({ required: true })
  productId: number;

  @prop() // todo add { required: true } after migrate
  variantId: string;

  @prop({ default: 0 })
  sortOrder: number;
}
