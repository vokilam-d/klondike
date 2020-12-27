import { elasticBooleanType, elasticDateType, elasticIntegerType, elasticTextType } from '../../shared/constants';
import { ElasticMetaTags } from '../../shared/models/elastic-meta-tags.model';
import { AdminBlogPostDto } from '../../shared/dtos/admin/blog-post.dto';
import { ElasticLinkedProduct } from '../../product/models/elastic-linked-product.model';
import { ElasticMultilingualText } from '../../shared/models/elastic-multilingual-text.model';

export class ElasticBlogPost implements Record<keyof AdminBlogPostDto, any> {
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
  category;
  createdAt = elasticDateType;
  featuredMedia;
  linkedPosts;
  linkedProducts = {
    type: 'nested',
    properties: new ElasticLinkedProduct()
  };
  medias;
  publishedAt = elasticDateType;
  shortContent = {
    type: 'nested',
    properties: new ElasticMultilingualText('text')
  };
  updatedAt = elasticDateType;
}
