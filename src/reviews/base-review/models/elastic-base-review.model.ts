import { BaseReviewDto } from '../../../shared/dtos/admin/base-review.dto';
import { elasticDateType, elasticTextType } from '../../../shared/constants';

export class ElasticBaseReview implements Record<keyof BaseReviewDto, any>{
  createdAt = elasticDateType;
  customerId = elasticTextType;
  email = elasticTextType;
  hasClientVoted = elasticTextType;
  id = elasticTextType;
  isEnabled = elasticTextType;
  medias: any;
  name = elasticTextType;
  rating = elasticTextType;
  sortOrder = elasticTextType;
  text = elasticTextType;
  votesCount = elasticTextType;
}
