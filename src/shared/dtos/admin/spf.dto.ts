import { IsOptional, IsString } from 'class-validator';
import { queryParamArrayDelimiter } from '../../constants';
import { IFilter, SortingPaginatingFilterDto } from '../shared-dtos/spf.dto';

export class AdminSPFDto extends SortingPaginatingFilterDto {
  @IsString()
  @IsOptional()
  filters: string;

  hasFilters(): boolean {
    return !!this.filters;
  }

  getNormalizedFilters(): IFilter[] {
    if (!this.hasFilters()) { return []; }

    const filters = decodeURIComponent(this.filters);
    return filters
      .split(queryParamArrayDelimiter)
      .map(filterStr => {
        const split = filterStr.split(':');
        return {
          fieldName: split[0],
          value: split[1]
        };
      });
  }
}
