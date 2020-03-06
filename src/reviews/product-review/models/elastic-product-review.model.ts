import { ProductReviewCommentDto, ProductReviewDto } from '../../../shared/dtos/admin/product-review.dto';
import { ElasticBaseReviewModel } from '../../base-review/models/elastic-base-review.model';
import { elasticBooleanType, elasticIntegerType, elasticTextType } from '../../../shared/constants';

export class ElasticProductReviewCommentModel implements Record<keyof ProductReviewCommentDto, any> {
  createdAt = elasticTextType;
  customerId = elasticIntegerType;
  email = elasticTextType;
  id = elasticTextType;
  isEnabled = elasticBooleanType;
  name = elasticTextType;
  text = elasticTextType;
}

export class ElasticProductReviewModel extends ElasticBaseReviewModel implements Record<keyof ProductReviewDto, any> {
  comments = {
    properties: new ElasticProductReviewCommentModel()
  };
  productId = elasticIntegerType;
  productName = elasticTextType;
  productVariantId = elasticTextType;

  constructor() {
    super();
  }
}
