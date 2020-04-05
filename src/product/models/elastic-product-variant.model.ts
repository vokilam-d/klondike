import { AdminProductVariantListItem } from '../../shared/dtos/admin/product-variant-list-item.dto';
import { elasticAutocompleteType, elasticBooleanType, elasticFloatType, elasticIntegerType, elasticTextType } from '../../shared/constants';
import { ElasticProductSelectedAttributeModel } from './elastic-product-selected-attribute.model';

export class ElasticProductVariantModel implements Record<keyof AdminProductVariantListItem, any> {
  currency = elasticTextType;
  id = elasticTextType;
  isEnabled = elasticBooleanType;
  mediaUrl = elasticTextType;
  mediaHoverUrl = elasticTextType;
  mediaAltText = elasticTextType;
  name = elasticAutocompleteType;
  slug = elasticTextType;
  price = elasticFloatType;
  priceInDefaultCurrency = elasticFloatType;
  qtyInStock = elasticIntegerType;
  sellableQty = elasticIntegerType;
  sku = elasticAutocompleteType;
  attributes = {
    properties: new ElasticProductSelectedAttributeModel()
  };
}
