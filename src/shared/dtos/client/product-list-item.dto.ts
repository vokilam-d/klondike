import { Expose, Type } from 'class-transformer';
import { ProductVariant } from '../../../product/models/product-variant.model';
import { Product } from '../../../product/models/product.model';
import { Attribute } from '../../../attribute/models/attribute.model';

export class ClientProductVariantDto {
  @Expose()
  slug: string;

  @Expose()
  label: string;

  @Expose()
  color: string;

  @Expose()
  isSelected: boolean;

  @Expose()
  isInStock: boolean;
}

export class ClientProductVariantGroupDto {
  attribute: Attribute;
  attributeValueId: string;

  @Expose()
  label: string;

  @Expose()
  selectedVariantLabel: string;

  @Expose()
  hasColor: boolean;

  @Expose()
  @Type(() => ClientProductVariantDto)
  variants: ClientProductVariantDto[];
}

type PickedProduct = Pick<Product, 'allReviewsCount' | 'textReviewsCount' | 'reviewsAvgRating'>;
type PickedVariant = Pick<ProductVariant, 'slug' | 'sku' | 'price'>
  & Record<keyof Pick<ProductVariant, 'name'>, string>;

export class ClientProductListItemDto implements PickedProduct, PickedVariant {
  @Expose()
  id: string;

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
  allReviewsCount: number;

  @Expose()
  textReviewsCount: number;
}
