import { IMetaTags } from './meta-tags.interface';

export interface IProduct {
  name: string;
  slug: string;
  sku: string;
  isEnabled: boolean;
  parentCategoryIds: string[];
  fullDescription?: string;
  shortDescription?: string;
  meta?: IMetaTags;
  mediaUrls?: string[];
}