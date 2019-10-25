import { CartedInventory } from './carted-inventory.model';
import { arrayProp, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Schema, Types } from 'mongoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';

export interface Inventory extends Base<Schema.Types.String> { }
export interface Inventory extends TimeStamps { }

export class Inventory {

  @prop()
  _id: Schema.Types.String; // product SKU

  @prop()
  productId: Types.ObjectId;

  @prop()
  qty: number;

  @arrayProp({ items: CartedInventory, default: [] })
  carted: CartedInventory[];

  static collectionName: string = 'inventory';
  static model = getModelForClass(Inventory);
}
