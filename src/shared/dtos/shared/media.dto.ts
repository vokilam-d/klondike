import { EMediaVariant } from '../../enums/media-variant.enum';
import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

type VariantsUrls = {
  [k in EMediaVariant]: string;
};

export abstract class MediaDto {
  @Expose()
  variantsUrls: VariantsUrls = {
    [EMediaVariant.Original]: '',
    [EMediaVariant.Large]: '',
    [EMediaVariant.Medium]: '',
    [EMediaVariant.Small]: '',
  };

  @Expose()
  @IsOptional()
  @IsString()
  altText: string;
}
