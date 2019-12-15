import { Transform } from 'class-transformer';
import { IsNumber, IsPositive, IsString } from 'class-validator';
import { sortFieldRegex } from '../../contants';

const defaultSortField = '-_id';

export class AdminSortingPaginatingDto {
  private _sort: string = defaultSortField;

  @IsString()
  set sort(value: string) {
    this._sort = value;
  }
  get sort(): string {
    const values = [];

    this._sort.split(',').forEach(field => {
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
  @IsNumber()
  limit: number = 20;

  @Transform((value => Number(value)))
  @IsPositive()
  page: number = 1;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
