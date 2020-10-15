import { AdminCategoryDto } from '../../shared/dtos/admin/category.dto';
import { elasticBooleanType, elasticIntegerType, elasticTextType } from '../../shared/constants';

export class ElasticCategory implements Omit<Record<keyof AdminCategoryDto, any>, 'breadcrumbs' | 'medias' | 'metaTags'> {
  createRedirect = elasticBooleanType;
  description = elasticTextType;
  id = elasticIntegerType;
  isEnabled = elasticBooleanType;
  name = elasticTextType;
  parentId = elasticIntegerType;
  reversedSortOrder = elasticIntegerType;
  slug = elasticTextType;
  defaultItemsSort = elasticTextType;
}
