import { AdminAggregatorDto } from '../../shared/dtos/admin/aggregator.dto';
import { elasticAutocompleteTextType, elasticBooleanType, elasticIntegerType, elasticTextType } from '../../shared/constants';

export class ElasticAggregator implements Record<keyof AdminAggregatorDto, any> {
  id = elasticIntegerType;
  name = elasticAutocompleteTextType;
  clientName = elasticTextType;
  isVisibleOnProductPage = elasticBooleanType;
  productIds = elasticIntegerType;
}
