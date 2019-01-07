import { BaseModel, baseSchemaOptions } from '../../shared/base.model';
import { arrayProp, InstanceType, ModelType, prop } from 'typegoose';
import { MetaTags } from '../../shared/models/meta-tags.model';
import { ICategory } from '../../../../shared/models/category.interface';
import { CategoryAncestor } from './category-ancestor.model';

export class Category extends BaseModel<Category> implements ICategory {

  @prop({ required: true })
  name: string;

  @prop({ required: true, unique: true })
  slug: string; // TODO add validation to spaces, only latin chars, number of chars

  @prop({ default: true })
  isEnabled: boolean;

  @prop({ default: null })
  parentId: string;

  @arrayProp({ items: CategoryAncestor })
  ancestors?: CategoryAncestor[];

  @prop()
  meta?: MetaTags;

  @prop()
  fullDescription?: string;

  @prop()
  shortDescription?: string;

  @prop()
  imageUrl?: string;

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