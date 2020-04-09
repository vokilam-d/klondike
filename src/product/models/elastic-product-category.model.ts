import { ProductCategory } from './product-category.model';
import { elasticTextType } from '../../shared/constants';

export class ElasticProductCategory implements Record<keyof ProductCategory, any> {
  id = elasticTextType;
  name = elasticTextType;
  slug = elasticTextType;
  sortOrder = elasticTextType;
}
