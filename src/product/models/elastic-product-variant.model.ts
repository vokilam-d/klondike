import { AdminProductVariantListItem } from '../../shared/dtos/admin/product-variant-list-item.dto';
import { elasticAutocompleteType, elasticTextType } from '../../shared/constants';

export class ElasticProductVariant implements Record<keyof AdminProductVariantListItem, any> {
  currency = elasticTextType;
  id = elasticTextType;
  isEnabled = elasticTextType;
  mediaUrl = elasticTextType;
  name = elasticAutocompleteType;
  price = elasticTextType;
  priceInDefaultCurrency = elasticTextType;
  qty = elasticTextType;
  sku = elasticAutocompleteType;
}
