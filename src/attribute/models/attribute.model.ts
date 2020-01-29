import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';

export class AttributeValue {
  @prop()
  id: string;

  @prop()
  label: string;

  @prop({ default: false })
  isDefault: boolean;
}

export class Attribute {
  @prop()
  _id: string; // internal code-name

  set id(id: string) { this._id = id; }
  get id(): string { return this._id; }

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
