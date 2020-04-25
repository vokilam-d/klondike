import { prop } from '@typegoose/typegoose';
import { Exclude } from 'class-transformer';
import { MediaVariantEnum } from '../enums/media-variant.enum';

type VariantsUrls = {
  [k in MediaVariantEnum]: string;
};

export class Media {
  @Exclude()
  @prop()
  _id: number;

  @Exclude()
  __v: any;

  @prop()
  variantsUrls: VariantsUrls = {
    [MediaVariantEnum.Original]: '',
    [MediaVariantEnum.Large]: '',
    [MediaVariantEnum.Medium]: '',
    [MediaVariantEnum.Small]: '',
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
