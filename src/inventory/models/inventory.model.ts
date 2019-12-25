import { CartedInventory } from './carted-inventory.model';
import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';

export class Inventory {
  @prop({ index: true, unique: true })
  sku: string;

  @prop({ index: true })
  productId: number;

  @prop()
  qty: number;

  @arrayProp({ items: CartedInventory, default: [], _id: false })
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
