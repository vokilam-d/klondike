import { AdminProductVariantListItemDto } from '../../shared/dtos/admin/product-variant-list-item.dto';
import { elasticBooleanType, elasticFloatType, elasticIntegerType, elasticKeywordType, elasticTextType } from '../../shared/constants';
import { ElasticProductSelectedAttributeModel } from './elastic-product-selected-attribute.model';
import { ElasticMultilingualText } from '../../shared/models/elastic-multilingual-text.model';

export class ElasticProductVariant implements Record<keyof AdminProductVariantListItemDto, any> {
  currency = elasticTextType;
  id = elasticTextType;
  isEnabled = elasticBooleanType;
  label = elasticKeywordType;
  mediaUrl = elasticTextType;
  mediaHoverUrl = elasticTextType;
  mediaAltText = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
  name = {
    type: 'nested',
    properties: new ElasticMultilingualText('autocomplete')
  };
  slug = elasticTextType;
  price = elasticFloatType;
  oldPrice = elasticFloatType;
  priceInDefaultCurrency = elasticFloatType;
  oldPriceInDefaultCurrency = elasticFloatType;
  qtyInStock = elasticIntegerType;
  sellableQty = elasticIntegerType;
  salesCount = elasticIntegerType;
  sku = elasticKeywordType;
  gtin = elasticKeywordType;
  vendorCode = elasticKeywordType;
  attributes = {
    type: 'nested',
    properties: new ElasticProductSelectedAttributeModel()
  };
  isIncludedInShoppingFeed = elasticBooleanType;
}
