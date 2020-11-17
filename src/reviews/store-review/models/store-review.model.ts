import { getModelForClass, prop } from '@typegoose/typegoose';
import { BaseReview } from '../../base-review/models/base-review.model';

export class StoreReview extends BaseReview {
  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  static collectionName: string = 'store-review';
}

export const StoreReviewModel = getModelForClass(StoreReview, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
