export const alphaNumDashUnderscoreRegex = new RegExp('^[a-zA-Z0-9\-_]+$');
export const sortFieldRegex = new RegExp('^(\-)?([a-zA-Z0-9_]+)$'); // [1]st group - DESC sign, [2]nd group - field name
export const notEmptyStringRegex = new RegExp('.+');
