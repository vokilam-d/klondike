import { ElasticMultilingualText } from './elastic-multilingual-text.model';
import { AdminMetaTagsDto } from '../dtos/admin/meta-tags.dto';

export class ElasticMetaTags implements Record<keyof AdminMetaTagsDto, any> {
  description = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
  keywords = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
  title = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
}
