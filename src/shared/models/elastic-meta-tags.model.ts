import { elasticTextType } from '../constants';
import { ClientMetaTagsDto } from '../dtos/client/meta-tags.dto';

export class ElasticMetaTags implements Record<keyof ClientMetaTagsDto, any> {
  description = elasticTextType;
  keywords = elasticTextType;
  title = elasticTextType;
}
