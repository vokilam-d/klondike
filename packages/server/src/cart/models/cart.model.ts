import { BaseModel, baseSchemaOptions } from '../../shared/base.model';
import { ECartStatus, ICart } from '../../../../shared/models/cart.interface';
import { arrayProp, ModelType, prop, InstanceType } from 'typegoose';
import { CartItem } from './cart-item.model';

export class Cart extends BaseModel<Cart> implements ICart {

  @prop()
  status: ECartStatus;

  @arrayProp({ items: CartItem })
  items: CartItem[];



  static collectionName: string = 'carts';

  static get model(): ModelType<Cart> {
    const schemaOptions = {
      ...baseSchemaOptions,
      collection: Cart.collectionName
    };

    return new Cart().getModelForClass(Cart, { schemaOptions });
  }

  static get modelName(): string {
    return this.model.modelName;
  }

  static createModel(): InstanceType<Cart> {
    return new this.model();
  }

}