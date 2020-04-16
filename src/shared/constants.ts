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
export const elasticAutocompleteLowercaseTextType = {
  "type" : "text",
  "analyzer": "analyze_autocomplete_lower_case",
  "search_analyzer": "search_autocomplete_lower_case"
};
export const elasticAutocompleteTextType = {
  "type" : "text",
  "analyzer": "analyse_autocomplete_letters_digits"
};
export const autocompleteSettings = {
  "analysis": {
    "analyzer": {
      "analyse_autocomplete_letters_digits": {
        "tokenizer": "autocomplete_letters_digits"
      },
      "analyze_autocomplete_lower_case": {
        "tokenizer": "autocomplete_letters_lowercase",
        "filter": [
          "lowercase"
        ]
      },
      "search_autocomplete_lower_case": {
        "tokenizer": "lowercase"
      }
    },
    "tokenizer": {
      "autocomplete_letters_lowercase": {
        "type": "edge_ngram",
        "min_gram": 1,
        "max_gram": 20,
        "token_chars": [
          "letter", "digit"
        ]
      },
      "autocomplete_letters_digits": {
        "type": "edge_ngram",
        "min_gram": 1,
        "max_gram": 20,
        "token_chars": [
          "letter", "digit"
        ]
      }
    }
  }
};
