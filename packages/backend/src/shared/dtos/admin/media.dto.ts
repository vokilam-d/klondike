import { IsBoolean, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { EMediaVariant } from 'shared/enums/media-variant.enum';

type VariantsUrls = {
  [k in EMediaVariant]: string;
};

export class MediaDto {
  // @Expose()
  // @IsString()
  // url: string;

  @Expose()
  variantsUrls: VariantsUrls = {
    [EMediaVariant.Original]: '',
    [EMediaVariant.Large]: '',
    [EMediaVariant.Medium]: '',
    [EMediaVariant.Small]: '',
  };

  @Expose()
  @IsString()
  altText: string;

  @Expose()
  @IsBoolean()
  isHidden: boolean;

  @Expose()
  @IsString()
  size: string;

  @Expose()
  @IsString()
  dimensions: string;
}
