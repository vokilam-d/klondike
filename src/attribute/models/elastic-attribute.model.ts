import { AdminAttributeDto, AdminAttributeValueDto } from '../../shared/dtos/admin/attribute.dto';
import { elasticAutocompleteTextType, elasticBooleanType, elasticTextType } from '../../shared/constants';

export class ElasticAttributeValueModel implements Record<keyof AdminAttributeValueDto, any> {
  id = elasticTextType;
  isDefault = elasticTextType;
  label = elasticAutocompleteTextType;
  color = elasticTextType;
}

export class ElasticAttributeModel implements Record<keyof AdminAttributeDto, any> {
  groupName = elasticTextType;
  id = elasticTextType;
  label = elasticAutocompleteTextType;
  type = elasticTextType;
  values = {
    properties: new ElasticAttributeValueModel()
  };
  isVisibleInFilters = elasticBooleanType;
  isVisibleInProduct = elasticBooleanType;
  hasColor = elasticBooleanType;
}
