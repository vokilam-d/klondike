import { ProductVariant } from '../../../product/models/product-variant.model';
import { Product } from '../../../product/models/product.model';
import { ClientProductVariantGroupDto } from './product-list-item.dto';
import { Expose, Type } from 'class-transformer';
import { ClientMediaDto } from './media.dto';
import { MetaTagsDto } from '../shared-dtos/meta-tags.dto';
import { BreadcrumbDto } from '../shared-dtos/breadcrumb.dto';
import { ClientLinkedProductDto } from './linked-product.dto';

export class ClientProductCharacteristic {
  label: string;
  code: string;
  value: string;
}

export class ClientProductCategoryDto {
  @Expose()

  id: number;

  @Expose()
  name: string;

  @Expose()
  slug: string;
}

type PickedProduct = Pick<Product, 'breadcrumbs' | 'allReviewsCount' | 'textReviewsCount' | 'reviewsAvgRating' | 'additionalServiceIds'>;
type PickedVariant = Pick<ProductVariant, 'name' | 'sku' | 'vendorCode' | 'slug' | 'price' | 'oldPrice' | 'fullDescription' | 'shortDescription' | 'isDiscountApplicable'>;

export class ClientProductDto implements PickedProduct, PickedVariant {
  @Expose()
  id: string;

  @Expose()
  productId: number;

  @Expose()
  variantId: string;

  @Expose()
  isInStock: boolean;

  @Expose()
  categories: ClientProductCategoryDto[];

  @Expose()
  @Type(() => ClientProductVariantGroupDto)
  variantGroups: ClientProductVariantGroupDto[];

  @Expose()
  @Type(() => ClientProductCharacteristic)
  characteristics: ClientProductCharacteristic[];

  @Expose()
  breadcrumbs: BreadcrumbDto[];

  @Expose()
  fullDescription: string;

  @Expose()
  shortDescription: string;

  @Expose()
  medias: ClientMediaDto[];

  @Expose()
  metaTags: MetaTagsDto;

  @Expose()
  name: string;

  @Expose()
  price: number;

  @Expose()
  oldPrice: number;

  @Expose()
  reviewsAvgRating: number;

  @Expose()
  allReviewsCount: number;

  @Expose()
  textReviewsCount: number;

  @Expose()
  sku: string;

  @Expose()
  slug: string;

  @Expose()
  vendorCode: string;

  @Expose()
  gtin: string;

  @Expose()
  relatedProducts: ClientLinkedProductDto[];

  @Expose()
  isDiscountApplicable: boolean;

  @Expose()
  additionalServiceIds: number[];
}
