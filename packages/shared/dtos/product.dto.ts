import { BackendMetaTags } from '../../backend/src/shared/models/meta-tags.model';

export class ProductDto {
  name: string;
  slug?: string;
  sku: string;
  qty?: number;
  isEnabled?: boolean;
  categoryIds: number[];
  price?: number;
  meta?: BackendMetaTags;
  fullDescription?: string;
  shortDescription?: string;
  mediaUrls?: string[];
}
