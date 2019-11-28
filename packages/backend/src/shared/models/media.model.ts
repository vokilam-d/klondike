import { prop } from '@typegoose/typegoose';
import { Exclude } from 'class-transformer';
import { EMediaVariant } from '../enums/media-variant.enum';

type VariantsUrls = {
  [k in EMediaVariant]: string;
};

export class BackendMedia {
  @Exclude()
  @prop()
  _id: number;

  @Exclude()
  __v: any;

  @prop()
  variantsUrls: VariantsUrls = {
    [EMediaVariant.Original]: '',
    [EMediaVariant.Large]: '',
    [EMediaVariant.Medium]: '',
    [EMediaVariant.Small]: '',
  };

  @prop()
  altText: string = '';

  @prop({ default: false })
  isHidden: boolean = false;

  @prop()
  size: string = '';

  @prop()
  dimensions: string = '';
}
