import { pre, prop, Typegoose } from 'typegoose';
import { SchemaOptions } from 'mongoose';

@pre<T>('findOneAndUpdate', function () {
  this._update.updatedAt = new Date();
})
export abstract class BaseModel<T> extends Typegoose {

  id: string;

  @prop()
  createdAt: string;

  @prop()
  updatedAt: string;
}

export const baseSchemaOptions: SchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
};