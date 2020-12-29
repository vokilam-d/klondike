import { AdminAttributeDto, AdminAttributeValueDto } from '../../shared/dtos/admin/attribute.dto';
import { elasticBooleanType, elasticTextType } from '../../shared/constants';
import { ElasticMultilingualText } from '../../shared/models/elastic-multilingual-text.model';

export class ElasticAttributeValueModel implements Record<keyof AdminAttributeValueDto, any> {
  id = elasticTextType;
  isDefault = elasticTextType;
  label = {
    type: 'nested',
    properties: new ElasticMultilingualText('autocomplete')
  };
  color = elasticTextType;
}

export class ElasticAttributeModel implements Record<keyof AdminAttributeDto, any> {
  id = elasticTextType;
  label = {
    type: 'nested',
    properties: new ElasticMultilingualText('autocomplete')
  };
  type = elasticTextType;
  values = {
    properties: new ElasticAttributeValueModel()
  };
  isVisibleInFilters = elasticBooleanType;
  isVisibleInProduct = elasticBooleanType;
  hasColor = elasticBooleanType;
}
