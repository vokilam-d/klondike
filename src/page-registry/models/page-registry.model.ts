import { getModelForClass, prop } from '@typegoose/typegoose';
import { PageTypeEnum } from '../../shared/enums/page-type.enum';

export class PageRegistry {

  @prop({ required: true, index: true, unique: true })
  slug: string;

  @prop({ required: true })
  type: PageTypeEnum;

  @prop({ default: null, required: false })
  redirectSlug?: string;

  createdAt: Date;
  updatedAt: Date;

  static collectionName: string = 'page-registry';
}

export const PageModel = getModelForClass(PageRegistry, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
