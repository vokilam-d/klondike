import { AdminProductReviewCommentDto, AdminProductReviewDto } from '../../../shared/dtos/admin/product-review.dto';
import { ElasticBaseReviewModel } from '../../base-review/models/elastic-base-review.model';
import { elasticBooleanType, elasticIntegerType, elasticTextType } from '../../../shared/constants';

export class ElasticProductReviewCommentModel implements Record<keyof AdminProductReviewCommentDto, any> {
  createdAt = elasticTextType;
  customerId = elasticIntegerType;
  email = elasticTextType;
  id = elasticTextType;
  isEnabled = elasticBooleanType;
  name = elasticTextType;
  text = elasticTextType;
}

export class ElasticProductReviewModel extends ElasticBaseReviewModel implements Record<keyof AdminProductReviewDto, any> {
  comments = {
    properties: new ElasticProductReviewCommentModel()
  };
  productId = elasticIntegerType;
  productName = elasticTextType;
  productVariantId = elasticTextType;
  managerComment = elasticTextType;

  constructor() {
    super();
  }
}
