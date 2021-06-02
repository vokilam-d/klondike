import { ProductVariant } from '../../../product/models/product-variant.model';
import { Product } from '../../../product/models/product.model';
import { ClientProductVariantGroupDto } from './product-list-item.dto';
import { Expose, Type } from 'class-transformer';
import { ClientMediaDto } from './media.dto';
import { ClientLinkedProductDto } from './linked-product.dto';
import { ClientMetaTagsDto } from './meta-tags.dto';
import { ClientBreadcrumbDto } from './breadcrumb.dto';
import { Language } from '../../enums/language.enum';
import { ProductLabelTypeEnum } from '../../enums/product-label-type.enum';
import { Category } from '../../../category/models/category.model';

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

  static transformToDto(category: Category, lang: Language): ClientProductCategoryDto {
    return {
      id: category.id,
      name: category.name[lang],
      slug: category.slug
    };
  }
}

type PickedProduct = Pick<Product, 'allReviewsCount' | 'textReviewsCount' | 'reviewsAvgRating' | 'additionalServiceIds'>;
type PickedVariant = Pick<ProductVariant, 'sku' | 'vendorCode' | 'slug' | 'price' | 'oldPrice' | 'isDiscountApplicable'>
  & Record<keyof Pick<ProductVariant, 'fullDescription' | 'shortDescription' | 'name'>, string>
  & Record<keyof Pick<ProductVariant, 'label'>, any>;

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

  @Expose()
  label: {
    type: ProductLabelTypeEnum,
    text: string
  };
}
