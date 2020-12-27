import { MultilingualText } from './multilingual-text.model';
import { elasticAutocompleteTextType, elasticTextType } from '../constants';

export class ElasticMultilingualText implements Record<keyof MultilingualText, any> {
  ru;
  uk;
  en;

  constructor(type: 'text' | 'autocomplete') {
    let elasticType: any;
    switch (type) {
      case 'autocomplete':
        elasticType = elasticAutocompleteTextType;
        break;
      case 'text':
      default:
        elasticType = elasticTextType;
        break;
    }

    this.ru = elasticType;
    this.uk = elasticType;
    this.en = elasticType;
  }
}
