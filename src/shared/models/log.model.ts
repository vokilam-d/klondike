import { prop } from '@typegoose/typegoose';

export class Log {
  @prop()
  time: Date;

  @prop()
  text: string;
}
