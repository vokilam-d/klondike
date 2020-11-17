import { IsString } from 'class-validator';
import { queryParamArrayDelimiter } from '../../constants';

export class GetClientAdditionalServicesQueryDto {
  @IsString()
  ids: string;

  idsAsArray(): number[] {
    const ids = decodeURIComponent(this.ids);
    return ids.split(queryParamArrayDelimiter).map(id => parseInt(id));
  }
}
