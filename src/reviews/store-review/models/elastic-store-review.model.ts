import { AdminStoreReviewDto } from '../../../shared/dtos/admin/store-review.dto';
import { ElasticBaseReviewModel } from '../../base-review/models/elastic-base-review.model';

export class ElasticStoreReviewModel extends ElasticBaseReviewModel implements Record<keyof AdminStoreReviewDto, any> {
  constructor() {
    super();
  }
}
