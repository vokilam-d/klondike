import { arrayProp, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { CartItem } from './cart-item.model';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { ECartStatus } from '../../../../shared/enums/cart.enum';

export interface Cart extends Base { }
export interface Cart extends TimeStamps { }

export class Cart {

  @prop()
  status: ECartStatus;

  @arrayProp({ items: CartItem })
  items: CartItem[];

  static collectionName: string = 'cart';
  static model = getModelForClass(Cart);
}
