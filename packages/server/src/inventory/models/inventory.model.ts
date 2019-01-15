import { BaseModel, baseSchemaOptions } from '../../shared/base.model';
import { IInventory } from '../../../../shared/models/inventory.interface';
import { CartedInventory } from './carted-inventory.model';
import { arrayProp, InstanceType, ModelType, prop } from 'typegoose';
import { Types } from 'mongoose';

export class Inventory extends BaseModel<Inventory> {

  @prop()
  _id: string; // product SKU

  @prop()
  productId: Types.ObjectId;

  @prop()
  qty: number;

  @arrayProp({ items: CartedInventory, default: [] })
  carted: CartedInventory[];

  static collectionName: string = 'inventory';

  static get model(): ModelType<Inventory> {
    const schemaOptions = {
      ...baseSchemaOptions,
      collection: Inventory.collectionName
    };

    return new Inventory().getModelForClass(Inventory, { schemaOptions });
  }

  static get modelName(): string {
    return this.model.modelName;
  }

  static createModel(): InstanceType<Inventory> {
    return new this.model();
  }
}