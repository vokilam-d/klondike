import { AdminProductListItemDto } from '../../shared/dtos/admin/product-list-item.dto';
import { elasticAutocompleteType, elasticTextType } from '../../shared/constants';
import { ElasticProductVariant } from './elastic-product-variant.model';


export class ElasticProduct implements Record<keyof AdminProductListItemDto, any> {
  id = elasticTextType;
  isEnabled = elasticTextType;
  mediaUrl = elasticTextType;
  name = elasticAutocompleteType;
  prices = elasticTextType;
  quantities = elasticTextType;
  skus = elasticTextType;
  variants = {
    type: 'nested',
    properties: new ElasticProductVariant()
  };
}
