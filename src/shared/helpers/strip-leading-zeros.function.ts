export function stripLeadingZeros(str: string): string {
  return str?.replace(/^0*(.*)/, '$1');
}
