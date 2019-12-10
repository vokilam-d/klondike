import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { CartItem } from './cart-item.model';
import { ECartStatus } from '../../../shared/enums/cart.enum';

export class Cart {

  @prop()
  status: ECartStatus;

  @arrayProp({ items: CartItem })
  items: CartItem[];

  static collectionName: string = 'cart';
}

export const CartModel = getModelForClass(Cart, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
