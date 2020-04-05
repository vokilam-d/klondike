import { ECurrencyCode } from '../../enums/currency.enum';
import { AdminProductSelectedAttributeDto } from './product-selected-attribute.dto';

export class AdminProductVariantListItem {
  id: string;
  isEnabled: boolean;
  mediaUrl: string;
  mediaHoverUrl: string;
  mediaAltText: string;
  attributes: AdminProductSelectedAttributeDto[];
  name: string;
  slug: string;
  sku: string;
  price: number;
  currency: ECurrencyCode;
  priceInDefaultCurrency: number;
  qtyInStock: number;
  sellableQty: number;
}
