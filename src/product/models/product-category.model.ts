import { prop } from '@typegoose/typegoose';

export class ProductCategory {
  @prop()
  id: number;

  @prop({ default: 0 })
  reversedSortOrder: number;

  @prop({ default: false })
  isSortOrderFixed: boolean;

  @prop({ default: 0 })
  reversedSortOrderBeforeFix: number;
}
