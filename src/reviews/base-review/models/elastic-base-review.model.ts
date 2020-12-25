import { AdminBaseReviewDto } from '../../../shared/dtos/admin/base-review.dto';
import { elasticBooleanType, elasticDateType, elasticFloatType, elasticIntegerType, elasticTextType } from '../../../shared/constants';

export class ElasticBaseReviewModel implements Record<keyof AdminBaseReviewDto, any>{
  createdAt = elasticDateType;
  customerId = elasticIntegerType;
  email = elasticTextType;
  hasClientVoted = elasticTextType;
  id = elasticIntegerType;
  isEnabled = elasticBooleanType;
  medias: any;
  name = elasticTextType;
  rating = elasticFloatType;
  sortOrder = elasticIntegerType;
  text = elasticTextType;
  votesCount = elasticIntegerType;
  managerComment = elasticTextType;
  source = elasticTextType;
}
