import { AdminAttributeDto, AdminAttributeValueDto } from '../../shared/dtos/admin/attribute.dto';
import { elasticBooleanType, elasticTextType } from '../../shared/constants';

export class ElasticAttributeValueModel implements Record<keyof AdminAttributeValueDto, any> {
  id = elasticTextType;
  isDefault = elasticTextType;
  label = elasticTextType;
}

export class ElasticAttributeModel implements Record<keyof AdminAttributeDto, any> {
  groupName = elasticTextType;
  id = elasticTextType;
  label = elasticTextType;
  type = elasticTextType;
  values = {
    properties: new ElasticAttributeValueModel()
  };
  isVisibleInFilters = elasticBooleanType;
  isVisibleInProduct = elasticBooleanType;
}
