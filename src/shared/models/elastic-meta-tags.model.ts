import { MetaTagsDto } from '../dtos/shared-dtos/meta-tags.dto';
import { elasticTextType } from '../constants';

export class ElasticMetaTags implements Record<keyof MetaTagsDto, any> {
  description = elasticTextType;
  keywords = elasticTextType;
  title = elasticTextType;
}
