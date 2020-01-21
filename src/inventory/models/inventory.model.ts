import { OrderedInventory } from './ordered-inventory.model';
import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';

export class Inventory {
  @prop({ index: true, unique: true })
  sku: string;

  @prop({ index: true })
  productId: number;

  @prop({ min: 0 })
  qty: number;

  @arrayProp({ items: OrderedInventory, default: [], _id: false })
  ordered: OrderedInventory[];

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
