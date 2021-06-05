import { prop } from '@typegoose/typegoose';
import { MediaVariantEnum } from '../enums/media-variant.enum';
import { MultilingualText } from './multilingual-text.model';

type VariantsUrls = {
  [k in MediaVariantEnum]: string;
};

export class Media {
  @prop()
  variantsUrls: VariantsUrls = {
    [MediaVariantEnum.Original]: '',
    [MediaVariantEnum.Large]: '',
    [MediaVariantEnum.LargeSquare]: '',
    [MediaVariantEnum.Medium]: '',
    [MediaVariantEnum.Small]: '',
  };

  @prop()
  altText: MultilingualText = new MultilingualText();

  @prop({ default: false })
  isHidden: boolean = false;

  @prop()
  size: string = '';

  @prop()
  dimensions: string = '';
}
