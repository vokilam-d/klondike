import { elasticAutocompleteTextType } from '../../shared/constants';
import { ProductSelectedAttribute } from './product-selected-attribute.model';

export class ElasticProductSelectedAttributeModel implements Record<keyof ProductSelectedAttribute, any> {
  attributeId = elasticAutocompleteTextType;
  valueIds = elasticAutocompleteTextType;
}
