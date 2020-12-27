import { MediaVariantEnum } from '../../enums/media-variant.enum';
import { Expose } from 'class-transformer';
import { Media } from '../../models/media.model';

type VariantsUrls = {
  [k in MediaVariantEnum]: string;
};

export abstract class BaseMediaDto implements Pick<Media, 'variantsUrls' | 'altText'> {
  @Expose()
  variantsUrls: VariantsUrls = {
    [MediaVariantEnum.Original]: '',
    [MediaVariantEnum.Large]: '',
    [MediaVariantEnum.Medium]: '',
    [MediaVariantEnum.Small]: '',
  };

  abstract altText: any;
}
