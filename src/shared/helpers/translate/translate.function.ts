import { TRANSLATIONS } from './translations';
import { Language } from '../../enums/language.enum';
import { MultilingualText } from '../../models/multilingual-text.model';

// todo remove "'ru'" as union type of "lang" param, leave only "Language"
function translate(str: keyof typeof TRANSLATIONS | string, lang: 'ru' | Language, ...args: any): string {

  let translation: string = TRANSLATIONS[str]?.[lang] || str;

  for (let i = 0; i < args.length; i++) {
    const keyToReplace = '$' + (i + 1);

    translation = compileTranslation(translation, keyToReplace, args[i]);
  }

  return translation;
}

function getTranslations(str: keyof typeof TRANSLATIONS | string, ...args: any): MultilingualText {
  const translation: MultilingualText = TRANSLATIONS[str] || {};

  for (let i = 0; i < args.length; i++) {
    const keyToReplace = '$' + (i + 1);

    for (const language of Object.values(Language)) {
      translation[language] = compileTranslation(translation[language], keyToReplace, args[i]);
    }
  }

  return translation;
}

function compileTranslation(translation: string, keyToReplace: string, valueToReplace: any): string {
  return translation.replace(keyToReplace, valueToReplace);
}

export { translate as __, getTranslations };
