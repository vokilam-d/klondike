export function addLeadingZeros(num: number | string, digitsCount: number): string {
  let numString = `${num}`;
  while (numString.length < digitsCount) {
    numString = `0${numString}`;
  }
  return numString;
}
