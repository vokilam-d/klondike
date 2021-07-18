import { AdminSupplierDto } from '../../shared/dtos/admin/supplier.dto';
import { elasticAutocompleteTextType, elasticIntegerType } from '../../shared/constants';

export class ElasticSupplier implements Record<keyof AdminSupplierDto, any>{
  id = elasticIntegerType;
  name = elasticAutocompleteTextType;
}
