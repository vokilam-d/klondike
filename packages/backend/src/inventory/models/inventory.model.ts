import { BackendCartedInventory } from './carted-inventory.model';
import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

export class BackendInventory {

  @prop()
  _id: string; // product SKU

  get id() { return this._id; }
  set id(id: string) { this._id = id; }

  @prop()
  productId: Types.ObjectId;

  @prop()
  qty: number;

  @arrayProp({ items: BackendCartedInventory, default: [] })
  carted: BackendCartedInventory[];

  static collectionName: string = 'inventory';
}

export const BackendInventoryModel = getModelForClass(BackendInventory);
