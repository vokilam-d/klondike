import { arrayProp, prop } from '@typegoose/typegoose';

export class ProductSelectedAttribute {
  /**
   * @type Attribute.id
   */
  @prop({ index: true })
  id: string;

  /**
   * @type AttributeValue.id
   */
  @arrayProp({ items: String })
  valueIds: string[];
}
