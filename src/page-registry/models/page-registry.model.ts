import { getModelForClass, prop } from '@typegoose/typegoose';

export class PageRegistry {

  @prop({ required: true, index: true})
  slug: string;

  @prop({ required: true })
  type: 'category' | 'product' | 'content';

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
