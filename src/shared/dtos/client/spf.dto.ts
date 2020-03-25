import { IFilter, SortingPaginatingFilterDto } from '../shared-dtos/spf.dto';
import { queryParamArrayDelimiter } from '../../constants';

export class ClientSortingPaginatingFilterDto extends SortingPaginatingFilterDto {

  [fieldName: string]: any;

  getNormalizedFilters(): IFilter[] {
    const filters: IFilter[] = [];
    const spfOwnFields: (keyof SortingPaginatingFilterDto | string)[] = ['limit', 'sort', 'page', 'skip'];

    Object.keys(this)
      .filter(fieldName => !spfOwnFields.includes(fieldName))
      .forEach(fieldName => {
        const queryValue = this[fieldName];
        if (queryValue === undefined) { return; }

        queryValue.toString()
          .split(queryParamArrayDelimiter)
          .map(value => decodeURIComponent(value))
          .forEach(value => {
            filters.push({ fieldName, value });
          });
      });

    return filters;
  }
}
