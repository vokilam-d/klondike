import { ProductVariant } from '../../../product/models/product-variant.model';
import { Product } from '../../../product/models/product.model';
import { ClientProductVariantGroupDto } from './product-list-item.dto';
import { Expose, Type } from 'class-transformer';
import { ClientMediaDto } from './media.dto';
import { ClientLinkedProductDto } from './linked-product.dto';
import { ClientMetaTagsDto } from './meta-tags.dto';
import { ClientBreadcrumbDto } from './breadcrumb.dto';
import { Language } from '../../enums/language.enum';
import { ProductCategory } from '../../../product/models/product-category.model';

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

  static transformToDto(productCategory: ProductCategory, lang: Language): ClientProductCategoryDto {
    return {
      id: productCategory.id,
      name: productCategory.name[lang],
      slug: productCategory.slug
    };
  }
}

type PickedProduct = Pick<Product, 'allReviewsCount' | 'textReviewsCount' | 'reviewsAvgRating' | 'additionalServiceIds'>
  & Record<keyof Pick<Product, 'breadcrumbs'>, ClientBreadcrumbDto[]>;
type PickedVariant = Pick<ProductVariant, 'sku' | 'vendorCode' | 'slug' | 'price' | 'oldPrice' | 'isDiscountApplicable'>
  & Record<keyof Pick<ProductVariant, 'fullDescription' | 'shortDescription' | 'name'>, string>;

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
  breadcrumbs: ClientBreadcrumbDto[];

  @Expose()
  fullDescription: string;

  @Expose()
  shortDescription: string;

  @Expose()
  medias: ClientMediaDto[];

  @Expose()
  metaTags: ClientMetaTagsDto;

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
