import { IMetaTags } from './meta-tags.interface';

export interface ICategory {
  name: string;
  slug: string;
  isEnabled: boolean;
  parentId?: string;
  ancestors?: ICategoryAncestor[];
  fullDescription?: string;
  shortDescription?: string;
  meta?: IMetaTags;
  imageUrl?: string;
}

export interface ICategoryAncestor {
  id: string;
  name: string;
  slug: string;
}