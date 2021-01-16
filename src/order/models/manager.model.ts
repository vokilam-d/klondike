import { prop } from '@typegoose/typegoose';

export class Manager {

  @prop()
  userId?: string;

  @prop()
  name?: string;

}
