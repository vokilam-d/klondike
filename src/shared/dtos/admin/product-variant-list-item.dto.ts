import { CurrencyCodeEnum } from '../../enums/currency.enum';
import { AdminProductSelectedAttributeDto } from './product-selected-attribute.dto';
import { AdminProductVariantDto } from './product-variant.dto';

export class AdminProductVariantListItem implements Pick<AdminProductVariantDto, 'id' | 'isEnabled' | 'attributes' | 'name' | 'slug' | 'sku' | 'price' | 'oldPrice' | 'currency' | 'priceInDefaultCurrency' | 'oldPriceInDefaultCurrency' | 'qtyInStock' | 'sellableQty' | 'vendorCode' | 'salesCount'> {
  id: string;
  isEnabled: boolean;
  mediaUrl: string;
  mediaHoverUrl: string;
  mediaAltText: string;
  attributes: AdminProductSelectedAttributeDto[];
  name: string;
  slug: string;
  sku: string;
  vendorCode: string;
  price: number;
  oldPrice: number;
  currency: CurrencyCodeEnum;
  priceInDefaultCurrency: number;
  oldPriceInDefaultCurrency: number;
  qtyInStock: number;
  sellableQty: number;
  salesCount: number;
}
