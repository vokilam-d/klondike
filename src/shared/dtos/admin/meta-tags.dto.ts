import { BaseMetaTagsDto } from '../shared-dtos/base-meta-tags.dto';
import { Expose, Type } from 'class-transformer';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';

export class AdminMetaTagsDto extends BaseMetaTagsDto {
  @Expose()
  @Type(() => MultilingualTextDto)
  title: MultilingualTextDto;

  @Expose()
  @Type(() => MultilingualTextDto)
  keywords: MultilingualTextDto;

  @Expose()
  @Type(() => MultilingualTextDto)
  description: MultilingualTextDto;
}
