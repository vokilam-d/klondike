import { prop } from '@typegoose/typegoose';
import { Language } from '../enums/language.enum';

type LangugeKeys = {
  [key in Language]: string;
};

export class MultilingualText implements LangugeKeys {
  @prop({ default: '' })
  ru: string = '';

  @prop({ default: '' })
  uk: string = '';

  @prop({ default: '' })
  en: string = '';
}
