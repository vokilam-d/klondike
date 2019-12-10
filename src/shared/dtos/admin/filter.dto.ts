import { Transform } from 'class-transformer';
import { IsPositive } from 'class-validator';
import { sortFieldRegex } from '../../contants';

const defaultSortField = '-_id';

export class AdminFilterDto {
  private _sort: string = defaultSortField;

  set sort(value: string) {
    this._sort = value;
  }
  get sort(): string {
    const matches = this._sort.match(sortFieldRegex);
    if (matches === null) {
      return defaultSortField;
    }

    const sortField = matches[2] === 'id' ? '_id' : matches[2];
    return `${matches[1] || ''}${sortField}`;
  }

  @Transform((value => Number(value)))
  limit: number = 20;

  @Transform((value => Number(value)))
  @IsPositive()
  page: number = 1;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
