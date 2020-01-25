export function addLeadingZeros(num: number, digitsCount: number = 8): string {
  let numString = `${num}`;
  while (numString.length < digitsCount) {
    numString = `0${numString}`;
  }
  return numString;
}
