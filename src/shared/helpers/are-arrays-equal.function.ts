export function areArraysEqual(firstArr: any[], secondArr: any[]): boolean {
  if (firstArr === secondArr) return true;
  if (!firstArr || !secondArr) return false;
  if (firstArr.length !== secondArr.length) return false;

  for (let i = 0; i < firstArr.length; ++i) {
    if (firstArr[i] !== secondArr[i]) return false;
  }
  return true;
}
