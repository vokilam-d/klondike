import {
  elasticAutocompleteLowercaseTextType,
  elasticKeywordType,
  elasticTextType
} from '../../shared/constants';
import { SettlementDto } from '../../shared/dtos/shared-dtos/settlement.dto';

export class ElasticSettlement implements Record<keyof SettlementDto, any> {

  static collectionName: string = 'settlement';

  id = elasticKeywordType;
  fullName = elasticTextType;
  name = elasticAutocompleteLowercaseTextType;
  ruName = elasticAutocompleteLowercaseTextType;

}
