import { BaseModel, baseSchemaOptions } from '../../shared/base.model';
import { InstanceType, ModelType, prop } from 'typegoose';
import { MetaTags } from '../../shared/models/meta-tags.model';
import { Types } from 'mongoose';
import { ICategory } from '../../../../shared/models/category.interface';

export class Category extends BaseModel<Category> implements ICategory {

  @prop({ required: true, unique: true })
  name: string;

  @prop({ required: true, unique: true })
  url: string;

  @prop({ default: true })
  isEnabled: boolean;

  @prop({ default: 0 })
  parentCategory: Types.ObjectId;

  @prop()
  fullDescription?: string;

  @prop()
  shortDescription?: string;

  @prop()
  meta?: MetaTags;

  @prop()
  image?: any;

  static collectionName: string = 'category';

  static get model(): ModelType<Category> {
    const schemaOptions = {
      ...baseSchemaOptions,
      collection: Category.collectionName
    };

    return new Category().getModelForClass(Category, { schemaOptions });
  }

  static get modelName(): string {
    return this.model.modelName;
  }

  static createModel(): InstanceType<Category> {
    return new this.model();
  }
}