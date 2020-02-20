export function stripHtmlTags(str: string): string {
  str = '' + str;
  return str.replace(/(<([^>]+)>)/ig, '');
}
