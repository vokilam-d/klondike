import { classToPlain, Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { queryParamArrayDelimiter, sortFieldRegex } from '../../constants';
import { ReturnModelType } from '@typegoose/typegoose';

const defaultSortField = '-_id';

export interface IFilter {
  fieldName: string;
  value: string;
}

export class AdminSortingPaginatingFilterDto {
  private _sort: string = defaultSortField;

  @IsString()
  set sort(value: string) {
    this._sort = value;
  }
  get sort(): string {
    const values = [];

    this._sort.split(queryParamArrayDelimiter).forEach(field => {
      const matches = field.match(sortFieldRegex);
      if (matches === null) {
        return;
      }

      const sortOrder = matches[1] || '';
      const sortField = matches[2] === 'id' ? '_id' : matches[2];
      values.push(`${sortOrder}${sortField}`);
    });

    return values.join(' ') || defaultSortField;
  }

  @Transform((value => Number(value)))
  @IsPositive()
  limit: number = 20;

  @Transform((value => Number(value)))
  @IsPositive()
  page: number = 1;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }

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

  // getFindConditionsForModel(model: ReturnModelType<new (...args: any) => any>) {
  //   const conditions: any = { };
  //   const modelKeys = Object.keys(new model().toObject());
  //   const spfKeys = Object.keys(classToPlain(this, { excludeExtraneousValues: true }));
  //
  //   Object.keys(this).forEach(key => {
  //     const conditionKey = key === 'id' ? '_id' : key;
  //     if (spfKeys.includes(key) || !modelKeys.includes(conditionKey)) { return; }
  //
  //     const valueFromQuery = this[key];
  //     let conditionValue = valueFromQuery;
  //     if (Array.isArray(valueFromQuery)) {
  //       conditionValue = [];
  //       valueFromQuery.forEach(v => {
  //         if (typeof v === 'string' && v.includes(',')) {
  //           conditionValue.push(...v.split(','));
  //         } else {
  //           conditionValue.push(v);
  //         }
  //       });
  //
  //       conditionValue = { $in: conditionValue };
  //
  //     } else if (typeof valueFromQuery === 'string' && valueFromQuery.includes(',')) {
  //       conditionValue = { $in: valueFromQuery.split(',') };
  //     } else {
  //       conditionValue = valueFromQuery;
  //     }
  //
  //
  //     conditions[conditionKey] = conditionValue;
  //   });
  //
  //   return conditions;
  // }
}
