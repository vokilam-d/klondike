import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { Types } from "mongoose";
import { Role } from '../../shared/enums/Role.enum';

export class User {

  @prop()
  _id: Types.ObjectId;

  get id() { return this._id; }
  set id(id) { this._id = id || new Types.ObjectId(); }

  @prop({ required: true })
  login: string;

  @prop({ required: true })
  password: string;

  @prop()
  name: string;

  @arrayProp({ items: String, default: [] })
  emails: string[];

  @prop({ enum: Role, default: Role.Manager })
  role: Role;

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
