import { Log } from './log.model';
import { elasticTextType } from '../constants';

export class ElasticLog implements Record<keyof Log, any> {
  text = elasticTextType;
  time = elasticTextType;
}
