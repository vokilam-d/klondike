import { TRANSLATIONS } from './translations';
import { Language } from '../../enums/language.enum';

// todo remove "'ru'" as union type of "lang" param, leave only "Language"
function translate(str: keyof typeof TRANSLATIONS | string, lang: 'ru' | Language, ...args: any): string {
  let translation = TRANSLATIONS[str]?.[lang] || str;

  for (let i = 0; i < args.length; i++) {
    const keyToReplace = '$' + (i + 1);
    translation = translation.replace(keyToReplace, args[i]);
  }

  return translation;
}

export { translate as __ };
