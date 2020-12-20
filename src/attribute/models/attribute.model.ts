import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { AttributeTypeEnum } from '../../shared/enums/attribute-type.enum';
import { MultilingualText } from '../../shared/models/multilingual-text.model';

export class AttributeValue {
  @prop()
  id: string;

  @prop()
  label: MultilingualText;

  @prop({ default: false })
  isDefault: boolean;

  @prop()
  color?: string;
}

export class Attribute {
  @prop()
  _id: string; // internal code-name

  set id(id: string) { this._id = id; }
  get id(): string { return this._id; }

  @prop()
  label: MultilingualText;

  @arrayProp({ items: AttributeValue, default: [], _id: false })
  values: AttributeValue[];

  @prop({ enum: AttributeTypeEnum })
  type: AttributeTypeEnum;

  @prop({ default: true })
  isVisibleInProduct: boolean;

  @prop({ default: true })
  isVisibleInFilters: boolean;

  @prop({ default: false })
  hasColor: boolean;

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
