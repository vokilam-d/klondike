import { AdminAggregatorDto } from '../../shared/dtos/admin/aggregator.dto';
import { elasticBooleanType, elasticIntegerType } from '../../shared/constants';
import { ElasticMultilingualText } from '../../shared/models/elastic-multilingual-text.model';

export class ElasticAggregator implements Record<keyof AdminAggregatorDto, any> {
  id = elasticIntegerType;
  name = {
    type: 'nested',
    properties: new ElasticMultilingualText('autocomplete')
  };
  clientName = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
  isVisibleOnProductPage = elasticBooleanType;
  productIds = elasticIntegerType;
}
