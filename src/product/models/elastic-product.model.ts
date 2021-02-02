import { AdminProductListItemDto } from '../../shared/dtos/admin/product-list-item.dto';
import { elasticBooleanType, elasticDateType, elasticFloatType, elasticIntegerType, elasticTextType } from '../../shared/constants';
import { ElasticProductVariant } from './elastic-product-variant.model';
import { ElasticProductSelectedAttributeModel } from './elastic-product-selected-attribute.model';
import { ElasticProductCategory } from './elastic-product-category.model';
import { ElasticMultilingualText } from '../../shared/models/elastic-multilingual-text.model';

export class ElasticProduct implements Record<keyof AdminProductListItemDto, any> {
  id = elasticIntegerType;
  categories = {
    type: 'nested',
    properties: new ElasticProductCategory()
  };
  isEnabled = elasticTextType;
  attributes = {
    type: 'nested',
    properties: new ElasticProductSelectedAttributeModel()
  };
  mediaUrl = elasticTextType;
  name = {
    type: 'nested',
    properties: new ElasticMultilingualText('autocomplete')
  };
  prices = elasticTextType;
  currency = elasticTextType;
  quantitiesInStock = elasticTextType;
  sellableQuantities = elasticTextType;
  skus = elasticTextType;
  gtins = elasticTextType;
  vendorCodes = elasticTextType;
  salesCount = elasticIntegerType;
  variants = {
    type: 'nested',
    properties: new ElasticProductVariant()
  };
  reviewsAvgRating = elasticFloatType;
  allReviewsCount = elasticIntegerType;
  textReviewsCount = elasticIntegerType;
  createdAt = elasticDateType;
  updatedAt = elasticDateType;
  note = elasticTextType;
  isIncludedInShoppingFeed = elasticBooleanType;
}
