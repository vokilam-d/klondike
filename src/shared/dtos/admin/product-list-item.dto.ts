import { AdminProductVariantListItem } from './product-variant-list-item.dto';
import { AdminProductSelectedAttributeDto } from './product-selected-attribute.dto';
import { AdminProductCategoryDto } from './product-category.dto';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';

export class AdminProductListItemDto {
  id: number;
  categories: AdminProductCategoryDto[];
  isEnabled: boolean;
  attributes: AdminProductSelectedAttributeDto[];
  mediaUrl: string;
  name: MultilingualTextDto;
  skus: string;
  vendorCodes: string;
  prices: string;
  quantitiesInStock: string;
  sellableQuantities: string;
  salesCount: number;
  allReviewsCount: number;
  textReviewsCount: number;
  reviewsAvgRating: number;
  variants?: AdminProductVariantListItem[];
  createdAt: Date;
  updatedAt: Date;
}
