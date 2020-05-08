import { getModelForClass, prop } from '@typegoose/typegoose';

export class PageRegistry {

  @prop({ required: true, index: true, unique: true })
  slug: string;

  @prop({ required: true })
  type: 'category' | 'product' | 'content' | 'blog-category' | 'blog-post';

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
