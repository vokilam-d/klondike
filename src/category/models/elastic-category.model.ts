import { AdminCategoryDto } from '../../shared/dtos/admin/category.dto';
import { elasticBooleanType, elasticIntegerType, elasticTextType } from '../../shared/constants';
import { ElasticMultilingualText } from '../../shared/models/elastic-multilingual-text.model';

export class ElasticCategory implements Omit<Record<keyof AdminCategoryDto, any>, 'breadcrumbs' | 'medias' | 'metaTags'> {
  createRedirect = elasticBooleanType;
  description = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
  id = elasticIntegerType;
  isEnabled = elasticBooleanType;
  name = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
  parentId = elasticIntegerType;
  reversedSortOrder = elasticIntegerType;
  slug = elasticTextType;
  defaultItemsSort = elasticTextType;
  canonicalCategoryId = elasticIntegerType;
}
