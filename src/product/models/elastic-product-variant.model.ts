import { AdminProductVariantListItem } from '../../shared/dtos/admin/product-variant-list-item.dto';
import { elasticAutocompleteType, elasticBooleanType, elasticFloatType, elasticIntegerType, elasticTextType } from '../../shared/constants';
import { ElasticProductSelectedAttributeModel } from './elastic-product-selected-attribute.model';
import { ElasticLinkedProduct } from './elastic-linked-product.model';

export class ElasticProductVariant implements Record<keyof AdminProductVariantListItem, any> {
  currency = elasticTextType;
  id = elasticTextType;
  isEnabled = elasticBooleanType;
  mediaUrl = elasticTextType;
  mediaHoverUrl = elasticTextType;
  mediaAltText = elasticTextType;
  name = elasticAutocompleteType;
  slug = elasticTextType;
  price = elasticFloatType;
  oldPrice = elasticFloatType;
  priceInDefaultCurrency = elasticFloatType;
  oldPriceInDefaultCurrency = elasticFloatType;
  qtyInStock = elasticIntegerType;
  sellableQty = elasticIntegerType;
  sku = elasticTextType;
  vendorCode = elasticTextType;
  attributes = {
    properties: new ElasticProductSelectedAttributeModel()
  };
}
