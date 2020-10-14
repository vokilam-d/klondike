import { elasticAutocompleteTextType, elasticBooleanType, elasticIntegerType, elasticTextType } from '../../shared/constants';
import { AdminBlogCategoryDto } from '../../shared/dtos/admin/blog-category.dto';
import { ElasticMetaTags } from '../../shared/models/elastic-meta-tags.model';

export class ElasticBlogCategory implements Record<keyof AdminBlogCategoryDto, any> {
  content = elasticTextType;
  id = elasticIntegerType;
  isEnabled = elasticBooleanType;
  metaTags = {
    type: 'nested',
    properties: new ElasticMetaTags()
  };
  name = elasticAutocompleteTextType;
  slug = elasticTextType;
  sortOrder = elasticIntegerType;
}
