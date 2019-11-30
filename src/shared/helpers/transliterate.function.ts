export function transliterate(word) {
  return word
    .toLowerCase()
    .split('')
    .map(char => transliterationMap[char] || char)
    .join('')
    .replace(spacesOrUnderscores, '-')
    .replace(notAlphaNumeric, '')
    .replace(multipleDashes, '-');
}

const notAlphaNumeric = /[^a-z0-9\-]/g;
const spacesOrUnderscores = /\s+|_+/g;
const multipleDashes = /-+/g;
const transliterationMap = {'ё':'yo','й':'i','ц':'ts','у':'u','к':'k','е':'e','н':'n','г':'g','ш':'sh','щ':'sch','з':'z','х':'h','ъ':'\'','ф':'f','ы':'i','в':'v','а':'a','п':'p','р':'r','о':'o','л':'l','д':'d','ж':'zh','э':'e','я':'ya','ч':'ch','с':'s','м':'m','и':'i','т':'t','ь':'\'','б':'b','ю':'yu'};
