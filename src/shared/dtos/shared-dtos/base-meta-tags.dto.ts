import { MetaTags } from '../../models/meta-tags.model';

export abstract class BaseMetaTagsDto implements MetaTags {
  abstract title: any;
  abstract keywords: any;
  abstract description: any;
}
