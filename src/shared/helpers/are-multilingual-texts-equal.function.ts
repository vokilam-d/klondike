import { MultilingualText } from '../models/multilingual-text.model';
import { Language } from '../enums/language.enum';


export function areMultilingualTextsEqual(text1: MultilingualText, text2: MultilingualText): boolean {
  return Object.values(Language).every(lang => {
    return text1[lang] === text2[lang];
  });
}
