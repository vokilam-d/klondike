import { elasticAutocompleteTextType, elasticKeywordType, elasticTextType } from '../../shared/constants';
import { WarehouseDto } from './warehouse.dto';

export class ElasticWarehouse implements Record<keyof WarehouseDto, any> {

  static collectionName: string = 'warehouse';

  id = elasticKeywordType;
  description = elasticTextType;
  settlementId = elasticKeywordType;
  postOfficeNumber = elasticAutocompleteTextType;
  address = elasticAutocompleteTextType;
  addressRu = elasticAutocompleteTextType;

}
