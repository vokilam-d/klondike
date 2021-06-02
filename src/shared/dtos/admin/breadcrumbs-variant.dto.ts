import { BreadcrumbsVariant } from '../../models/breadcrumbs-variant.model';
import { IsBoolean, IsNumber } from 'class-validator';
import { Expose } from 'class-transformer';

export class BreadcrumbsVariantDto implements BreadcrumbsVariant {
  @Expose()
  @IsBoolean()
  isActive: boolean;

  @Expose()
  @IsNumber(undefined, { each: true })
  categoryIds: number[];
}
