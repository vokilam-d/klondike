import { ECurrencyCode } from '../../enums/currency.enum';

export class AdminProductVariantListItem {
  id: string;
  isEnabled: boolean;
  mediaUrl: string;
  name: string;
  sku: string;
  price: number;
  currency: ECurrencyCode;
  priceInDefaultCurrency: number;
  qty: number;
}
