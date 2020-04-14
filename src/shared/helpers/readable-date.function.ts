import { addLeadingZeros } from './add-leading-zeros.function';

export function readableDate(date: Date): string {
  const day = addLeadingZeros(date.getDay() + 1, 2);
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const hours = addLeadingZeros(date.getHours(), 2);
  const minutes = addLeadingZeros(date.getMinutes(), 2);

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

const MONTHS = [
  'янв.',
  'фев.',
  'март.',
  'апр.',
  'май',
  'июнь',
  'июль',
  'авг.',
  'сен.',
  'окт.',
  'ноя.',
  'дек.',
];
