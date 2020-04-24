import { AdminLinkedProductDto } from '../../shared/dtos/admin/linked-product.dto';
import { elasticIntegerType, elasticTextType } from '../../shared/constants';

export class ElasticLinkedProduct implements Record<keyof AdminLinkedProductDto, any> {
  productId = elasticTextType;
  sortOrder = elasticIntegerType;
  variantId = elasticTextType;
}
