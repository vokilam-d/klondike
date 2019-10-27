import { MetaTagsDto } from '../meta-tags.dto';

export class AdminCategoryDto {
  id: string;
  isEnabled: boolean = true;
  name: string = '';
  description: string = '';
  slug: string = '';
  metaTags: MetaTagsDto;
}
