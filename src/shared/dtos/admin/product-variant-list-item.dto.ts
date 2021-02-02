import { CurrencyCodeEnum } from '../../enums/currency.enum';
import { AdminProductSelectedAttributeDto } from './product-selected-attribute.dto';
import { AdminProductVariantDto } from './product-variant.dto';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';

export class AdminProductVariantListItemDto implements Pick<AdminProductVariantDto, 'id' | 'isEnabled' | 'attributes' | 'name' | 'slug' | 'sku' | 'price' | 'oldPrice' | 'currency' | 'priceInDefaultCurrency' | 'oldPriceInDefaultCurrency' | 'qtyInStock' | 'sellableQty' | 'vendorCode' | 'salesCount' | 'gtin' | 'isIncludedInShoppingFeed'> {
  id: string;
  isEnabled: boolean;
  mediaUrl: string;
  mediaHoverUrl: string;
  mediaAltText: MultilingualTextDto;
  attributes: AdminProductSelectedAttributeDto[];
  name: MultilingualTextDto;
  slug: string;
  sku: string;
  gtin: string;
  vendorCode: string;
  price: number;
  oldPrice: number;
  currency: CurrencyCodeEnum;
  priceInDefaultCurrency: number;
  oldPriceInDefaultCurrency: number;
  qtyInStock: number;
  sellableQty: number;
  salesCount: number;
  isIncludedInShoppingFeed: boolean;
}
