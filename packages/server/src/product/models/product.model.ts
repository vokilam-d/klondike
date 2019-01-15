import { BaseModel, baseSchemaOptions } from '../../shared/base.model';
import { IProduct } from '../../../../shared/models/product.interface';
import { arrayProp, InstanceType, ModelType, prop } from 'typegoose';
import { MetaTags } from '../../shared/models/meta-tags.model';

export class Product extends BaseModel<Product> implements IProduct {

  @prop({ required: true })
  name: string;

  @prop({ required: true })
  slug: string;

  @prop({ required: true })
  sku: string;

  @prop({ default: false })
  isEnabled: boolean;

  @arrayProp({ items: String })
  categoryIds: string[];

  @prop({ default: 0 })
  price: number;

  @prop()
  meta?: MetaTags;

  @prop()
  fullDescription?: string;

  @prop()
  shortDescription?: string;

  @arrayProp({ items: String })
  mediaUrls?: string[];

  static collectionName: string = 'product';

  static get model(): ModelType<Product> {
    const schemaOptions = {
      ...baseSchemaOptions,
      collection: Product.collectionName
    };

    return new Product().getModelForClass(Product, { schemaOptions });
  }

  static get modelName(): string {
    return this.model.modelName;
  }

  static createModel(): InstanceType<Product> {
    return new this.model();
  }
}