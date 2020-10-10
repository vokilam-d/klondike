import { MediaVariantEnum } from '../../enums/media-variant.enum';
import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';

type VariantsUrls = {
  [k in MediaVariantEnum]: string;
};

export abstract class MediaDto {
  @Expose()
  variantsUrls: VariantsUrls = {
    [MediaVariantEnum.Original]: '',
    [MediaVariantEnum.Large]: '',
    [MediaVariantEnum.Medium]: '',
    [MediaVariantEnum.Small]: '',
  };

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  altText: string;
}
