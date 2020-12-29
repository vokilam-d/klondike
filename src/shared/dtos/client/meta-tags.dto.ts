import { Expose } from 'class-transformer';
import { BaseMetaTagsDto } from '../shared-dtos/base-meta-tags.dto';
import { MetaTags } from '../../models/meta-tags.model';
import { Language } from '../../enums/language.enum';

export class ClientMetaTagsDto extends BaseMetaTagsDto {
  @Expose()
  title: string;

  @Expose()
  keywords: string;

  @Expose()
  description: string;

  static transformToDto(metaTags: MetaTags, lang: Language): ClientMetaTagsDto {
    return {
      title: metaTags.title[lang],
      description: metaTags.description[lang],
      keywords: metaTags.keywords[lang]
    };
  }
}
