import { prop } from '@typegoose/typegoose';

export class ProductSelectedAttribute {
  /**
   * @type Attribute.id
   */
  @prop({ index: true })
  attributeId: string;

  /**
   * @type AttributeValue.id
   */
  @prop()
  valueId: string;
}
