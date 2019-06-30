import { BaseModel, baseSchemaOptions } from '../../shared/base.model';
import { IPageRegistry } from '../../../../shared/models/page-registry.interface';
import { InstanceType, ModelType, prop } from 'typegoose';

export class PageRegistry extends BaseModel<PageRegistry> implements IPageRegistry {

  @prop({ required: true, index: true})
  slug: string;

  @prop({ required: true })
  type: 'category' | 'product' | 'content';

  static collectionName: string = 'page-registry';

  static get model(): ModelType<PageRegistry> {
    const schemaOptions = {
      ...baseSchemaOptions,
      collection: PageRegistry.collectionName
    };

    return new PageRegistry().getModelForClass(PageRegistry, { schemaOptions });
  }

  static get modelName(): string {
    return this.model.modelName;
  }

  static createModel(): InstanceType<PageRegistry> {
    return new this.model();
  }
}