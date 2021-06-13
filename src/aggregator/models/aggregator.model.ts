import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { MultilingualText } from '../../shared/models/multilingual-text.model';

export class Aggregator {
  @prop()
  _id: number;

  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop({ _id: false })
  name: MultilingualText;

  @prop({ _id: false })
  clientName: MultilingualText;

  @prop()
  isVisibleOnProductPage: boolean;

  @prop({ default: false })
  isInPriority: boolean;

  @arrayProp({ items: Number })
  productIds: number[];

  static collectionName: string = 'aggregator';
}


export const AggregatorModel = getModelForClass(Aggregator, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
