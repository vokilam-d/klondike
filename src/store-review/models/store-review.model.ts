import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';

export class StoreReviewVote {
  @prop()
  userId: string;

  @prop()
  sessionId: string;

  @prop()
  customerId: string;

  @prop()
  ip: string;
}

export class StoreReview {
  @prop()
  _id: number;

  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop()
  name: string;

  @prop()
  text: string;

  @prop()
  email: string;

  @prop()
  customerId: number;

  @prop()
  rating: number;

  @arrayProp({ items: StoreReviewVote, default: [] })
  votes: StoreReviewVote[];


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
