import { BaseModel, baseSchemaOptions } from '../base.model';
import { InstanceType, ModelType, prop } from 'typegoose';

export class Counter extends BaseModel<Counter> {

  @prop({ default: 0 })
  seq: number;

  static collectionName: string = 'counter';

  static get model(): ModelType<Counter> {
    const schemaOptions = {
      ...baseSchemaOptions,
      collection: Counter.collectionName
    };

    return new Counter().getModelForClass(Counter, { schemaOptions });
  }

  static get modelName(): string {
    return this.model.modelName;
  }

  static createModel(): InstanceType<Counter> {
    return new this.model();
  }

}