import { AdminProductVariantListItem } from './product-variant-list-item.dto';

export class AdminProductListItemDto {
  id: number;
  isEnabled: boolean;
  mediaUrl: string;
  name: string;
  skus: string;
  prices: string;
  quantities: string;
  variants?: AdminProductVariantListItem[];
}
