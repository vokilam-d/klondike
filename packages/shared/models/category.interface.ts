import { IMetaTags } from './meta-tags.interface';

export interface ICategory {
  name: string;
  url: string;
  isEnabled: boolean;
  parentCategory?: string | any;
  fullDescription?: string;
  shortDescription?: string;
  meta?: IMetaTags;
  image?: any;
}