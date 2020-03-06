import { IFilter, SortingPaginatingFilterDto } from '../shared/spf.dto';
import { queryParamArrayDelimiter } from '../../constants';
import { getPropertyOf } from '../../helpers/get-property-of.function';
import { Product } from '../../../product/models/product.model';
import { IsOptional, IsString } from 'class-validator';

const defaultSortField = '-' + getPropertyOf<Product>('sortOrder');

export class ClientSortingPaginatingFilterDto extends SortingPaginatingFilterDto {
  @IsString()
  @IsOptional()
  sort = defaultSortField;

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
          .forEach(value => {
            filters.push({ fieldName, value });
          });
      });

    return filters;
  }
}
