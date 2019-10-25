import { getModelForClass, prop } from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';

export interface BackendCounter extends Base { }
export interface BackendCounter extends TimeStamps { }

export class BackendCounter {

  @prop({ default: 0 })
  seq: number;

  static collectionName: string = 'counter';
  static model = getModelForClass(BackendCounter);
}
