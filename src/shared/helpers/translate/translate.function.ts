import { TRANSLATIONS } from './translations';

function translate(str: keyof typeof TRANSLATIONS | string, lang: string, ...args: any): string {
  let translation = TRANSLATIONS[str]?.[lang] || str;

  for (let i = 0; i < args.length; i++) {
    const keyToReplace = '$' + (i + 1);
    translation = translation.replace(keyToReplace, args[i]);
  }

  return translation;
}

export { translate as __ };
