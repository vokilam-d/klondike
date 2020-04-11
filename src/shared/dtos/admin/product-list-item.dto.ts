import { AdminProductVariantListItem } from './product-variant-list-item.dto';
import { AdminProductSelectedAttributeDto } from './product-selected-attribute.dto';
import { AdminProductCategoryDto } from './product-category.dto';

export class AdminProductListItemDto {
  id: number;
  categories: AdminProductCategoryDto[];
  isEnabled: boolean;
  attributes: AdminProductSelectedAttributeDto[];
  mediaUrl: string;
  name: string;
  skus: string;
  prices: string;
  quantitiesInStock: string;
  sellableQuantities: string;
  reviewsCount: number;
  reviewsAvgRating: number;
  variants?: AdminProductVariantListItem[];
}
