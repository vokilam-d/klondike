import { prop } from '@typegoose/typegoose';
import { Language } from '../enums/language.enum';

type LangugeKeys = {
  [key in Language]: string;
};

interface IMultilingualText extends LangugeKeys {
}

export class MultilingualText implements IMultilingualText {
  @prop({ default: '' })
  ru: string = '';

  @prop({ default: '' })
  uk: string = '';

  @prop({ default: '' })
  en: string = '';
}
