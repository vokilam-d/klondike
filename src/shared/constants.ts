export const alphaNumDashUnderscoreRegex = new RegExp('^[a-zA-Z0-9\-_]+$');
export const sortFieldRegex = new RegExp('^(\-)?([a-zA-Z0-9_]+)$'); // [1]st group - DESC sign, [2]nd group - field name
export const notEmptyStringRegex = new RegExp('.+');
export const isEmailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}/;
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
export const elasticIntegerType = {
  "type": "integer"
};
export const elasticFloatType = {
  "type": "scaled_float",
  "scaling_factor": 100
};
export const elasticBooleanType = {
  "type": "boolean"
};
export const bcryptSaltRounds = 10;
