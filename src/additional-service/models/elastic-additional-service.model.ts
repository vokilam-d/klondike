import { AdminAdditionalServiceDto } from '../../shared/dtos/admin/additional-service.dto';
import { elasticBooleanType, elasticFloatType, elasticIntegerType } from '../../shared/constants';
import { ElasticMultilingualText } from '../../shared/models/elastic-multilingual-text.model';

export class ElasticAdditionalService implements Record<keyof AdminAdditionalServiceDto, any> {
  id = elasticIntegerType;
  name = {
    type: 'nested',
    properties: new ElasticMultilingualText('autocomplete')
  };
  clientName = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
  isEnabled = elasticBooleanType;
  price = elasticFloatType;
}
