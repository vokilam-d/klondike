import { ECurrencyCode } from '../../enums/currency.enum';
import { AdminProductSelectedAttributeDto } from './product-selected-attribute.dto';
import { AdminProductVariantDto } from './product-variant.dto';
import { AdminLinkedProductDto } from './linked-product.dto';

export class AdminProductVariantListItem implements Pick<AdminProductVariantDto, 'id' | 'isEnabled' | 'attributes' | 'name' | 'slug' | 'sku' | 'price' | 'oldPrice' | 'currency' | 'priceInDefaultCurrency' | 'oldPriceInDefaultCurrency' | 'qtyInStock' | 'sellableQty'> {
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
  oldPrice: number;
  currency: ECurrencyCode;
  priceInDefaultCurrency: number;
  oldPriceInDefaultCurrency: number;
  qtyInStock: number;
  sellableQty: number;
}
