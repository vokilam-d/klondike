import { Expose, Type } from 'class-transformer';
import { ProductVariant } from '../../../product/models/product-variant.model';
import { Product } from '../../../product/models/product.model';

export class ClientProductVariantDto {
  @Expose()
  slug: string;

  @Expose()
  label: string;

  @Expose()
  isSelected: boolean;
}

export class ClientProductVariantGroupDto {
  @Expose()
  label: string;

  @Expose()
  @Type(() => ClientProductVariantDto)
  variants: ClientProductVariantDto[];
}

type PickedProduct = Pick<Product, 'reviewsCount' | 'reviewsAvgRating'>;
type PickedVariant = Pick<ProductVariant, 'slug' | 'sku' | 'name' | 'priceInDefaultCurrency'>;

export class ClientProductListItemDto implements PickedProduct, PickedVariant {
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
  @Type(() => ClientProductVariantGroupDto)
  variantGroups: ClientProductVariantGroupDto[];

  @Expose()
  reviewsAvgRating: number;

  @Expose()
  reviewsCount: number;
}
