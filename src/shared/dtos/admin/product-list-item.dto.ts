import { AdminProductVariantListItemDto } from './product-variant-list-item.dto';
import { AdminProductSelectedAttributeDto } from './product-selected-attribute.dto';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';
import { AdminProductListItemCategoryDto } from './product-list-item-category.dto';

export class AdminProductListItemDto {
  id: number;
  categories: AdminProductListItemCategoryDto[];
  isEnabled: boolean;
  attributes: AdminProductSelectedAttributeDto[];
  mediaUrl: string;
  name: MultilingualTextDto;
  skus: string;
  gtins: string;
  currency: string;
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
}
