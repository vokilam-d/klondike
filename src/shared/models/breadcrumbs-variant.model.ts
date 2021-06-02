import { arrayProp, prop } from '@typegoose/typegoose';

export class BreadcrumbsVariant {
  @prop()
  isActive: boolean;

  @arrayProp({ items: Number, default: [] })
  categoryIds: number[];
}
