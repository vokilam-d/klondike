import { Expose, Type } from 'class-transformer';
import { ProductVariant } from '../../../product/models/product-variant.model';
import { Product } from '../../../product/models/product.model';
import { ClientLinkedProductDto } from './linked-product.dto';

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
type PickedVariant = Record<keyof Pick<ProductVariant, 'slug' | 'sku' | 'name' | 'price'>, any>;

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
  price: number;

  @Expose()
  oldPrice: number;

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
