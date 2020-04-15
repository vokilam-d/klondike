import {
  elasticAutocompleteTextType,
  elasticKeywordType,
  elasticTextType
} from '../../shared/constants';
import { CityDto } from './city.dto';

export class ElasticCity implements Record<keyof CityDto, any> {

  static collectionName: string = 'city';

  id = elasticKeywordType;
  fullName = elasticTextType;
  name = elasticAutocompleteTextType;
  ruName = elasticAutocompleteTextType;

}
