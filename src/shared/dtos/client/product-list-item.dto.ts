import { Expose, Type } from 'class-transformer';
import { ProductVariant } from '../../../product/models/product-variant.model';

export class ClientProductListItemVariantDto {
  @Expose()
  slug: string;

  @Expose()
  label: string;

  @Expose()
  isSelected: boolean;
}

export class ClientProductListItemVariantGroupDto {
  @Expose()
  label: string;

  @Expose()
  @Type(() => ClientProductListItemVariantDto)
  variants: ClientProductListItemVariantDto[];
}

type PickedVariant = Pick<ProductVariant, 'slug' | 'sku' | 'name' | 'priceInDefaultCurrency'>;

export class ClientProductListItemDto implements PickedVariant {
  @Expose()
  productId: number;

  @Expose()
  variantId: string;

  @Expose()
  name: string;

  @Expose()
  mediaUrl: string;

  @Expose()
  mediaHoverUrl: string;

  @Expose()
  mediaAltText: string;

  @Expose()
  priceInDefaultCurrency: number;

  @Expose()
  isInStock: boolean;

  @Expose()
  sku: string;

  @Expose()
  slug: string;

  @Expose()
  @Type(() => ClientProductListItemVariantGroupDto)
  variantGroups: ClientProductListItemVariantGroupDto[];
}
