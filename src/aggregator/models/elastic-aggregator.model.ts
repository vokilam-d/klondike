import { AdminAggregatorDto } from '../../shared/dtos/admin/aggregator.dto';
import { elasticBooleanType, elasticIntegerType, elasticTextType } from '../../shared/constants';

export class ElasticAggregator implements Record<keyof AdminAggregatorDto, any> {
  id = elasticIntegerType;
  name = elasticTextType;
  isVisibleOnProductPage = elasticBooleanType;
  productIds = elasticIntegerType;
}
