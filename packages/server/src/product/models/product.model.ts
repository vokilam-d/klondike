import { BaseModel, baseSchemaOptions } from '../../shared/base.model';
import { arrayProp, InstanceType, ModelType, prop } from 'typegoose';
import { MetaTags } from '../../shared/models/meta-tags.model';
import { Types } from 'mongoose';

export class Product extends BaseModel<Product> {

  @prop({ required: true })
  name: string;

  @prop({ required: true, index: true })
  slug: string;

  @prop({ required: true })
  sku: string;

  @prop({ default: true })
  isEnabled: boolean;

  @arrayProp({ items: Types.ObjectId })
  categoryIds: Types.ObjectId[];

  @prop({ default: 0 })
  price: number;

  @prop()
  meta?: MetaTags;

  @prop()
  fullDescription?: string;

  @prop()
  shortDescription?: string;

  @arrayProp({ items: String, default: [] })
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
