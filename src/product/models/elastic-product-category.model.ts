import { ProductCategory } from './product-category.model';
import { elasticBooleanType, elasticIntegerType, elasticKeywordType, elasticTextType } from '../../shared/constants';
import { ElasticMultilingualText } from '../../shared/models/elastic-multilingual-text.model';

export class ElasticProductCategory implements Record<keyof ProductCategory, any> {
  id = elasticKeywordType;
  name = {
    type: 'nested',
    properties: new ElasticMultilingualText('autocomplete')
  };
  slug = elasticTextType;
  sortOrder = elasticIntegerType;
  isEnabled = elasticBooleanType;
  reversedSortOrder = elasticIntegerType;
  isSortOrderFixed = elasticBooleanType;
  reversedSortOrderBeforeFix = elasticIntegerType;
}
