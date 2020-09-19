import { AdminProductVariantListItem } from '../../shared/dtos/admin/product-variant-list-item.dto';
import {
  elasticAutocompleteTextType,
  elasticBooleanType,
  elasticFloatType,
  elasticIntegerType,
  elasticKeywordType,
  elasticTextType
} from '../../shared/constants';
import { ElasticProductSelectedAttributeModel } from './elastic-product-selected-attribute.model';

export class ElasticProductVariant implements Record<keyof AdminProductVariantListItem, any> {
  currency = elasticTextType;
  id = elasticTextType;
  isEnabled = elasticBooleanType;
  mediaUrl = elasticTextType;
  mediaHoverUrl = elasticTextType;
  mediaAltText = elasticTextType;
  name = elasticAutocompleteTextType;
  slug = elasticTextType;
  price = elasticFloatType;
  oldPrice = elasticFloatType;
  priceInDefaultCurrency = elasticFloatType;
  oldPriceInDefaultCurrency = elasticFloatType;
  qtyInStock = elasticIntegerType;
  sellableQty = elasticIntegerType;
  salesCount = elasticIntegerType;
  sku = elasticKeywordType;
  vendorCode = elasticKeywordType;
  attributes = {
    type: 'nested',
    properties: new ElasticProductSelectedAttributeModel()
  };
}
