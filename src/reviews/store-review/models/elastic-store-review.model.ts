import { StoreReviewDto } from '../../../shared/dtos/admin/store-review.dto';
import { ElasticBaseReview } from '../../base-review/models/elastic-base-review.model';
import { elasticTextType } from '../../../shared/constants';

export class ElasticStoreReview extends ElasticBaseReview implements Record<keyof StoreReviewDto, any> {
  managerComment = elasticTextType;

  constructor() {
    super();
  }
}
