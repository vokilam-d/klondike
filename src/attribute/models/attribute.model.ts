import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { Exclude, Expose } from 'class-transformer';

export class AdminAttributeValue {
  @prop()
  id: string;

  @prop()
  name: string;

  @prop()
  isDefault: boolean;
}

export class Attribute {
  @Exclude()
  @prop()
  _id: string; // internal name

  @Exclude()
  __v: any;

  @Expose()
  get id(): string { return this._id; }
  set id(id: string) { this._id = id; }

  @prop()
  label: string; // UI name

  @arrayProp({ items: AdminAttributeValue, default: [], _id: false })
  values: AdminAttributeValue[];

  @prop()
  groupName: string;

  static collectionName: string = 'attribute';
}

export const AttributeModel = getModelForClass(Attribute, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    }
  }
});
