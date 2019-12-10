import { getModelForClass, prop } from '@typegoose/typegoose';

export class Counter {

  @prop()
  _id: string;

  @prop({ default: 0 })
  seq: number;

  static collectionName: string = 'counter';
}

export const CounterModel = getModelForClass(Counter, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
