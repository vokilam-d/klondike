import { StoreReviewDto } from '../../../shared/dtos/admin/store-review.dto';
import { ElasticBaseReviewModel } from '../../base-review/models/elastic-base-review.model';
import { elasticTextType } from '../../../shared/constants';

export class ElasticStoreReviewModel extends ElasticBaseReviewModel implements Record<keyof StoreReviewDto, any> {
  managerComment = elasticTextType;

  constructor() {
    super();
  }
}
