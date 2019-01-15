import { IMetaTags } from './meta-tags.interface';

export interface IProduct {
  name: string;
  slug: string;
  sku: string;
  isEnabled: boolean;
  categoryIds: string[];
  price: number;
  fullDescription?: string;
  shortDescription?: string;
  meta?: IMetaTags;
  mediaUrls?: string[];

  // TODO add manufacturer
}