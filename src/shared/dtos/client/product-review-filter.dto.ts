import { IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { ClientSortingPaginatingFilterDto } from './spf.dto';

export class ClientProductReviewFilterDto extends ClientSortingPaginatingFilterDto {

  @Transform((value => Number(value)))
  @IsNumber()
  productId: number;
}
