import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';

export interface Counter extends Base { }
export interface Counter extends TimeStamps { }

export class Counter {

  @prop({ default: 0 })
  seq: number;

  static collectionName: string = 'counter';
  static model = getModelForClass(Counter);
}
