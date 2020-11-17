import { prop } from '@typegoose/typegoose';

// todo convert product breadcrumbs into ids[], then use this as reference to build them
export class ProductCategory {
  @prop()
  id: number;

  @prop()
  name: string;

  @prop()
  slug: string;

  @prop()
  isEnabled: boolean;

  /**
   * @deprecated
   */
  @prop({ default: 0 })
  sortOrder: number;

  @prop({ default: 0 })
  reversedSortOrder: number;

  @prop({ default: false })
  isSortOrderFixed: boolean;

  @prop({ default: 0 })
  reversedSortOrderBeforeFix: number;
}
