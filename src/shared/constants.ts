export const alphaNumDashUnderscoreRegex = new RegExp('^[a-zA-Z0-9\-_]+$');
export const sortFieldRegex = new RegExp('^(\-)?(.+)$'); // [1]st group - DESC sign, [2]nd group - field name
export const notEmptyStringRegex = new RegExp('.+');
export const isEmailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}/;
export const validPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;
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
export const elasticKeywordType = {
  "type": "keyword"
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
export const elasticAutocompleteTextType = {
  "type" : "text",
  "analyzer": "autocomplete",
  "search_analyzer": "autocomplete_search"
};
export const autocompleteSettings = {
  "analysis": {
    "analyzer": {
      "autocomplete": {
        "tokenizer": "autocomplete",
        "filter": [
          "lowercase"
        ]
      },
      "autocomplete_search": {
        "tokenizer": "lowercase"
      }
    },
    "tokenizer": {
      "autocomplete": {
        "type": "edge_ngram",
        "min_gram": 2,
        "max_gram": 20,
        "token_chars": [
          "letter"
        ]
      }
    }
  }
};
