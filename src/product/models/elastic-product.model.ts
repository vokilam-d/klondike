import { AdminProductListItemDto } from '../../shared/dtos/admin/product-list-item.dto';
import { elasticFloatType, elasticIntegerType, elasticTextType } from '../../shared/constants';
import { ElasticProductVariant } from './elastic-product-variant.model';
import { ElasticProductSelectedAttributeModel } from './elastic-product-selected-attribute.model';
import { ElasticProductCategory } from './elastic-product-category.model';

export class ElasticProduct implements Record<keyof AdminProductListItemDto, any> {
  id = elasticIntegerType;
  categories = {
    type: 'nested',
    properties: new ElasticProductCategory()
  };
  isEnabled = elasticTextType;
  attributes = {
    properties: new ElasticProductSelectedAttributeModel()
  };
  mediaUrl = elasticTextType;
  name = elasticTextType;
  prices = elasticTextType;
  quantitiesInStock = elasticTextType;
  sellableQuantities = elasticTextType;
  skus = elasticTextType;
  variants = {
    type: 'nested',
    properties: new ElasticProductVariant()
  };
  reviewsAvgRating = elasticFloatType;
  reviewsCount = elasticIntegerType;
}
