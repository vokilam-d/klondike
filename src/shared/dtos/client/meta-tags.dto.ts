import { Expose } from 'class-transformer';
import { BaseMetaTagsDto } from '../shared-dtos/base-meta-tags.dto';

export class ClientMetaTagsDto extends BaseMetaTagsDto {
  @Expose()
  title: string;

  @Expose()
  keywords: string;

  @Expose()
  description: string;
}
