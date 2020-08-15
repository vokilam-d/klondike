import { getModelForClass, prop } from '@typegoose/typegoose';

export class ProductQuickReview {
  @prop({ required: true })
  productId: number;

  @prop({ required: true, min: 1, max: 5 })
  rating: number;

  @prop()
  userId: string;

  @prop()
  customerId: number;

  @prop()
  ip: string;

  static collectionName: string = 'product-quick-review';
}

export const ProductQuickReviewModel = getModelForClass(ProductQuickReview, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
