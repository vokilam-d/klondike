import { IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { ClientSPFDto } from './spf.dto';

export class ClientProductReviewFilterDto extends ClientSPFDto {

  @Transform((value => Number(value)))
  @IsNumber()
  productId: number;
}
