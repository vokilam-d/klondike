import { BaseMediaDto } from '../shared-dtos/base-media.dto';
import { Expose } from 'class-transformer';
import { Media } from '../../models/media.model';
import { Language } from '../../enums/language.enum';

export class ClientMediaDto extends BaseMediaDto {
  @Expose()
  altText: string;

  static transformToDto(media: Media, lang: Language): ClientMediaDto {
    return {
      variantsUrls: media.variantsUrls,
      altText: media.altText[lang]
    }
  }
}
