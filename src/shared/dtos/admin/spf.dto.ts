import { IsOptional, IsString } from 'class-validator';
import { queryParamArrayDelimiter } from '../../constants';
import { IFilter, SortingPaginatingFilterDto } from '../shared-dtos/spf.dto';
import { AdminProductListItemDto } from './product-list-item.dto';
import { AdminProductCategoryDto } from './product-category.dto';
import { TrimString } from '../../decorators/trim-string.decorator';

export class AdminSPFDto extends SortingPaginatingFilterDto {
  @IsString()
  @IsOptional()
  @TrimString()
  filters: string;

  get sortFilter(): any {
    const categoriesProp: keyof AdminProductListItemDto = 'categories';
    const sortOrderProp: keyof AdminProductCategoryDto = 'reversedSortOrder';
    const idProp: keyof AdminProductCategoryDto = 'id';
    const categorySortOrderProp = `${categoriesProp}.${sortOrderProp}`;
    const categoryIdProp = `${categoriesProp}.${idProp}`;

    const categoryIdFilter = this.getNormalizedFilters().find(filter => filter.fieldName === categoryIdProp);
    const sortObj = this.getSortAsObj();
    if (categoryIdFilter && sortObj[categorySortOrderProp]) {
      return {
        [categoryIdProp]: categoryIdFilter.values[0]
      };
    }
  }

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
          values: split[1].split('|')
        };
      });
  }
}
