import { getModelForClass, prop } from '@typegoose/typegoose';

export class BackendCounter {

  @prop()
  _id: string;

  @prop({ default: 0 })
  seq: number;

  static collectionName: string = 'counter';
}

export const BackendCounterModel = getModelForClass(BackendCounter);
