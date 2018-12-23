import { BaseModel, schemaOptions } from '../../shared/base.model';
import { InstanceType, ModelType, prop } from 'typegoose';

export class Category extends BaseModel<Category> {
  @prop({ required: true, unique: true })
  name: string;

  @prop()
  description: string;

  static get model(): ModelType<Category> {
    return new Category().getModelForClass(Category, { schemaOptions: schemaOptions});
  }

  static get modelName(): string {
    return this.model.modelName;
  }

  static createModel(): InstanceType<Category> {
    return new this.model();
  }

}