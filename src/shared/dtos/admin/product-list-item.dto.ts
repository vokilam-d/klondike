import { AdminProductVariantListItem } from './product-variant-list-item.dto';
import { AdminProductSelectedAttributeDto } from './product-selected-attribute.dto';

export class AdminProductListItemDto {
  id: number;
  categoryIds: number[];
  isEnabled: boolean;
  attributes: AdminProductSelectedAttributeDto[];
  mediaUrl: string;
  name: string;
  skus: string;
  prices: string;
  quantitiesInStock: string;
  sellableQuantities: string;
  sortOrder: number;
  reviewsCount: number;
  reviewsAvgRating: number;
  variants?: AdminProductVariantListItem[];
}
