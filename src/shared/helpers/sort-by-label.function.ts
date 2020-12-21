import { Language } from '../enums/language.enum';
import { MultilingualText } from '../models/multilingual-text.model';

interface ValueWithLabel<T> {
  label: T;
}

const compareLabels = (aLabel: string, bLabel: string): number => {
  let aLabel2 = aLabel;
  let bLabel2 = bLabel;
  if (aLabel2.startsWith('№')) { aLabel2 = aLabel2.slice(1); }
  if (bLabel2.startsWith('№')) { bLabel2 = bLabel2.slice(1); }

  const aParsed = parseInt(aLabel2);
  const bParsed = parseInt(bLabel2);
  if (Number.isNaN(aParsed) || Number.isNaN(bParsed)) {
    return aLabel > bLabel ? 1 : -1;
  }

  return aParsed - bParsed;
}

export function sortByLabel<T extends ValueWithLabel<string>>(values: T[]): T[] {
  values.sort((a, b) => compareLabels(a.label, b.label));

  return values;
}

export function sortByMultilingualLabel<T extends ValueWithLabel<MultilingualText>>(values: T[], lang: Language): T[] {
  values.sort((a, b) => compareLabels(a.label[lang], b.label[lang]));

  return values;
}
