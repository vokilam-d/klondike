import { ProductReviewCommentDto, ProductReviewDto } from '../../../shared/dtos/admin/product-review.dto';
import { ElasticBaseReview } from '../../base-review/models/elastic-base-review.model';
import { elasticTextType } from '../../../shared/constants';

export class ElasticProductReviewComment implements Record<keyof ProductReviewCommentDto, any> {
  createdAt = elasticTextType;
  customerId = elasticTextType;
  email = elasticTextType;
  id = elasticTextType;
  isEnabled = elasticTextType;
  name = elasticTextType;
  text = elasticTextType;
}

export class ElasticProductReview extends ElasticBaseReview implements Record<keyof ProductReviewDto, any> {
  comments = {
    properties: new ElasticProductReviewComment()
  };
  productId = elasticTextType;
  productName = elasticTextType;
  productVariantId = elasticTextType;

  constructor() {
    super();
  }
}
