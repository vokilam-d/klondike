export const alphaNumDashUnderscoreRegex = new RegExp('^[a-zA-Z0-9\-_]+$');
export const sortFieldRegex = new RegExp('^(\-)?([a-zA-Z0-9_]+)$'); // [1]st group - DESC sign, [2]nd group - field name
export const notEmptyStringRegex = new RegExp('.+');
export const queryParamArrayDelimiter = ',';
export const elasticAutocompleteType = {
  "type": "search_as_you_type"
};
export const elasticTextType = {
  "fields" : {
    "keyword" : {
      "type" : "keyword",
      "ignore_above" : 256
    }
  },
  "type" : "text"
};
export const elasticDateType = {
  "type": "date"
};
