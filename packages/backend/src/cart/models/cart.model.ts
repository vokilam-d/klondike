import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { BackendCartItem } from './cart-item.model';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { ECartStatus } from '../../../../shared/enums/cart.enum';

export class BackendCart {

  @prop()
  status: ECartStatus;

  @arrayProp({ items: BackendCartItem })
  items: BackendCartItem[];

  static collectionName: string = 'cart';
}

export const BackendCartModel = getModelForClass(BackendCart);
