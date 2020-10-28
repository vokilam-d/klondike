import { arrayProp, prop } from '@typegoose/typegoose';
import { Media } from '../../../shared/models/media.model';

export class ReviewVote {
  @prop()
  userId: string;

  @prop()
  customerId: number;

  @prop()
  ip: string;
}

export abstract class BaseReview {
  @prop()
  _id: number;

  abstract set id(id: number);
  abstract get id(): number;

  @prop({ default: true })
  isEnabled: boolean;

  @prop({ required: true })
  name: string;

  @prop({ required: true })
  text: string;

  @prop({ required: true })
  email: string;

  @prop({ default: null })
  customerId: number;

  @prop({ min: 1, max: 5, required: true })
  rating: number;

  @arrayProp({ items: ReviewVote, default: [] })
  votes: ReviewVote[];

  @prop({ default: 0, min: 0 })
  sortOrder: number;

  @arrayProp({ items: Media, default: [] })
  medias: Media[];

  @prop({ default: new Date() })
  createdAt: Date;

  @prop({ default: '' })
  managerComment: string;
}
