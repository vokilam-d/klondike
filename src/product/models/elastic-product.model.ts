import { AdminProductListItemDto } from '../../shared/dtos/admin/product-list-item.dto';
import { elasticAutocompleteType, elasticFloatType, elasticIntegerType, elasticTextType } from '../../shared/constants';
import { ElasticProductVariantModel } from './elastic-product-variant.model';
import { ElasticProductSelectedAttributeModel } from './elastic-product-selected-attribute.model';

export class ElasticProductModel implements Record<keyof AdminProductListItemDto, any> {
  id = elasticTextType;
  categoryIds = elasticTextType;
  isEnabled = elasticTextType;
  attributes = {
    properties: new ElasticProductSelectedAttributeModel()
  };
  mediaUrl = elasticTextType;
  name = elasticAutocompleteType;
  prices = elasticTextType;
  quantities = elasticTextType;
  skus = elasticTextType;
  sortOrder = elasticIntegerType;
  variants = {
    properties: new ElasticProductVariantModel()
  };
  reviewsAvgRating = elasticFloatType;
  reviewsCount = elasticIntegerType;
}
