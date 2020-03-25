import { ProductVariant } from '../../../product/models/product-variant.model';
import { Product } from '../../../product/models/product.model';
import { ClientProductVariantGroupDto } from './product-list-item.dto';
import { Expose, Type } from 'class-transformer';
import { ClientMediaDto } from './media.dto';
import { MetaTagsDto } from '../shared-dtos/meta-tags.dto';
import { BreadcrumbDto } from '../shared-dtos/breadcrumb.dto';

export class ClientProductCharacteristic {
  label: string;
  code: string;
  value: string;
}

export class ClientProductCategoryDto {
  id: number;
  name: string;
  slug: string;
}

type PickedProduct = Pick<Product, 'breadcrumbs' | 'reviewsCount' | 'reviewsAvgRating'>;
type PickedVariant = Pick<ProductVariant, 'name' | 'sku' | 'vendorCode' | 'slug' | 'priceInDefaultCurrency' | 'fullDescription' | 'shortDescription'>;

export class ClientProductDto implements PickedProduct, PickedVariant {
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
  priceInDefaultCurrency: number;

  @Expose()
  reviewsAvgRating: number;

  @Expose()
  reviewsCount: number;

  @Expose()
  sku: string;

  @Expose()
  slug: string;

  @Expose()
  vendorCode: string;

  @Expose()
  gtin: string;
}
