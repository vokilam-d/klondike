import { AdminSortingPaginatingFilterDto } from './spf.dto';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class ProductReviewFilterDto extends AdminSortingPaginatingFilterDto {
  @IsOptional()
  @Transform((value => Number(value)))
  @IsNumber()
  productId: number;
}
