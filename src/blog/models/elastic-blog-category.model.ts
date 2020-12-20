import { elasticBooleanType, elasticIntegerType, elasticTextType } from '../../shared/constants';
import { AdminBlogCategoryDto } from '../../shared/dtos/admin/blog-category.dto';
import { ElasticMetaTags } from '../../shared/models/elastic-meta-tags.model';
import { ElasticMultilingualText } from '../../shared/models/elastic-multilingual-text.model';

export class ElasticBlogCategory implements Record<keyof AdminBlogCategoryDto, any> {
  content = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
  id = elasticIntegerType;
  isEnabled = elasticBooleanType;
  metaTags = {
    type: 'nested',
    properties: new ElasticMetaTags()
  };
  name = {
    type: 'nested',
    properties: new ElasticMultilingualText('autocomplete')
  };
  slug = elasticTextType;
  sortOrder = elasticIntegerType;
}
