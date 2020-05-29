import { IFilter, SortingPaginatingFilterDto } from '../shared-dtos/spf.dto';
import { queryParamArrayDelimiter } from '../../constants';

export class ClientSPFDto extends SortingPaginatingFilterDto {

  [fieldName: string]: any;

  getNormalizedFilters(): IFilter[] {
    const filters: IFilter[] = [];
    const spfOwnFields: (keyof SortingPaginatingFilterDto | string)[] = ['limit', 'sort', 'page', 'skip'];

    Object.keys(this)
      .filter(fieldName => !spfOwnFields.includes(fieldName))
      .forEach(fieldName => {
        let queryValue = this[fieldName];
        if (queryValue === undefined) { return; }

        filters.push({
          fieldName,
          values: decodeURIComponent(queryValue).split(queryParamArrayDelimiter)
        });
      });

    return filters;
  }
}
