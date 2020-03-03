import { AdminSortingPaginatingFilterDto } from './filter.dto';
import { IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class OrderFilterDto extends AdminSortingPaginatingFilterDto {
  @IsOptional()
  @Transform((value => Number(value)))
  @IsNumber()
  customerId: number;
}
