import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { BaseReview } from '../../base-review/models/base-review.model';
import { Types } from 'mongoose';

export class ProductReviewComment {
  _id: Types.ObjectId;

  @prop({ default: true })
  isEnabled: boolean;

  @prop()
  name: string;

  @prop()
  text: string;

  @prop()
  email: string;

  @prop()
  customerId: number;

  @prop({ default: new Date() })
  createdAt: Date;
}

export class ProductReview extends BaseReview {
  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop()
  productId: number;

  @prop()
  productName: string;

  @prop()
  productVariantId: string;

  @arrayProp({ items: ProductReviewComment, default: [], _id: true })
  comments: ProductReviewComment[];

  static collectionName: string = 'product-review';
}

export const ProductReviewModel = getModelForClass(ProductReview, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
