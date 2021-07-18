import { AdminProductVariantListItemDto } from './product-variant-list-item.dto';
import { AdminProductSelectedAttributeDto } from './product-selected-attribute.dto';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';
import { AdminProductListItemCategoryDto } from './product-list-item-category.dto';
import { Product } from '../../../product/models/product.model';
import { ProductVariant } from '../../../product/models/product-variant.model';
import { CurrencyCodeEnum } from '../../enums/currency.enum';

type PickedProduct = Pick<Product, 'id' | 'categories' | 'isEnabled' | 'attributes' | 'name' | 'allReviewsCount' | 'textReviewsCount' | 'reviewsAvgRating' | 'createdAt' | 'updatedAt' | 'note' | 'supplierId'>;
type PickedProductVariant = Pick<ProductVariant, 'currency' | 'salesCount' | 'isIncludedInShoppingFeed'>;

export class AdminProductListItemDto implements PickedProduct, PickedProductVariant {
  id: number;
  categories: AdminProductListItemCategoryDto[];
  isEnabled: boolean;
  attributes: AdminProductSelectedAttributeDto[];
  mediaUrl: string;
  name: MultilingualTextDto;
  skus: string;
  gtins: string;
  currency: CurrencyCodeEnum;
  vendorCodes: string;
  prices: string;
  quantitiesInStock: string;
  sellableQuantities: string;
  salesCount: number;
  allReviewsCount: number;
  textReviewsCount: number;
  reviewsAvgRating: number;
  variants?: AdminProductVariantListItemDto[];
  createdAt: Date;
  updatedAt: Date;
  note: string;
  isIncludedInShoppingFeed: boolean;
  supplierId: number;
}
