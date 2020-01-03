import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { Exclude, Expose } from 'class-transformer';

export class AttributeValue {
  @prop()
  id: string;

  @prop()
  label: string;

  @prop()
  isDefault: boolean;
}

export class Attribute {
  @Exclude()
  @prop()
  _id: string; // internal code-name

  @Exclude()
  __v: any;

  @Expose()
  get id(): string { return this._id; }
  set id(id: string) { this._id = id; }

  @prop()
  label: string; // UI name

  @arrayProp({ items: AttributeValue, default: [], _id: false })
  values: AttributeValue[];

  @prop()
  groupName: string;

  static collectionName: string = 'attribute';
}

export const AttributeModel = getModelForClass(Attribute, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
