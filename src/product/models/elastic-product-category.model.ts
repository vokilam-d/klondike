import { ProductCategory } from './product-category.model';
import { elasticAutocompleteTextType, elasticIntegerType, elasticKeywordType, elasticTextType } from '../../shared/constants';

export class ElasticProductCategory implements Record<keyof ProductCategory, any> {
  id = elasticKeywordType;
  name = elasticAutocompleteTextType;
  slug = elasticTextType;
  sortOrder = elasticIntegerType;
}
