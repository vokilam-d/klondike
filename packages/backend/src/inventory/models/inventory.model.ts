import { BackendCartedInventory } from './carted-inventory.model';
import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { Schema, Types } from 'mongoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';

export interface BackendInventory extends Base<Schema.Types.String> { }
export interface BackendInventory extends TimeStamps { }

export class BackendInventory {

  @prop()
  _id: Schema.Types.String; // product SKU

  @prop()
  productId: Types.ObjectId;

  @prop()
  qty: number;

  @arrayProp({ items: BackendCartedInventory, default: [] })
  carted: BackendCartedInventory[];

  static collectionName: string = 'inventory';
  static model = getModelForClass(BackendInventory);
}
