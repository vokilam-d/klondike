import { AdminAttributeDto, AdminAttributeValueDto } from '../../shared/dtos/admin/attribute.dto';
import { elasticTextType } from '../../shared/constants';

export class ElasticAttributeValue implements Record<keyof AdminAttributeValueDto, any> {
  id = elasticTextType;
  isDefault = elasticTextType;
  label = elasticTextType;
}

export class ElasticAttribute implements Record<keyof AdminAttributeDto, any> {
  groupName = elasticTextType;
  id = elasticTextType;
  label = elasticTextType;
  values = {
    properties: new ElasticAttributeValue()
  };
}
