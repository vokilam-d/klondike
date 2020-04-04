import { getModelForClass, prop } from '@typegoose/typegoose';

export class User {
  @prop({ required: true })
  login: string;

  @prop({ required: true })
  password: string;

  createdAt: Date;
  updatedAt: Date;

  static collectionName = 'user';
}

export const UserModel = getModelForClass(User, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
