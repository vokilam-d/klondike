import { CartedInventory } from './carted-inventory.model';
import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

export class Inventory {

  @prop()
  _id: string; // product SKU

  get id() { return this._id; }
  set id(id: string) { this._id = id; }

  @prop()
  productId: number;

  @prop()
  qty: number;

  @arrayProp({ items: CartedInventory, default: [] })
  carted: CartedInventory[];

  static collectionName: string = 'inventory';
}

export const InventoryModel = getModelForClass(Inventory, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
