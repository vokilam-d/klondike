import { AdminAdditionalServiceDto } from '../../shared/dtos/admin/additional-service.dto';
import { elasticAutocompleteTextType, elasticBooleanType, elasticFloatType, elasticIntegerType, elasticTextType } from '../../shared/constants';

export class ElasticAdditionalService implements Record<keyof AdminAdditionalServiceDto, any> {
  id = elasticIntegerType;
  name = elasticAutocompleteTextType;
  clientName = elasticTextType;
  isEnabled = elasticBooleanType;
  price = elasticFloatType;
}
