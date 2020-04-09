import { AdminProductListItemDto } from '../../shared/dtos/admin/product-list-item.dto';
import {
  elasticAutocompleteType,
  elasticFloatType,
  elasticIntegerType,
  elasticKeywordType,
  elasticTextType
} from '../../shared/constants';
import { ElasticProductVariantModel } from './elastic-product-variant.model';
import { ElasticProductSelectedAttributeModel } from './elastic-product-selected-attribute.model';
import { ElasticProductCategory } from './elastic-product-category.model';

export class ElasticProductModel implements Record<keyof AdminProductListItemDto, any> {
  id = elasticKeywordType;
  categories = {
    properties: new ElasticProductCategory()
  };
  isEnabled = elasticTextType;
  attributes = {
    properties: new ElasticProductSelectedAttributeModel()
  };
  mediaUrl = elasticTextType;
  name = elasticAutocompleteType;
  prices = elasticTextType;
  quantitiesInStock = elasticTextType;
  sellableQuantities = elasticTextType;
  skus = elasticTextType;
  sortOrder = elasticIntegerType;
  variants = {
    properties: new ElasticProductVariantModel()
  };
  reviewsAvgRating = elasticFloatType;
  reviewsCount = elasticIntegerType;
}
