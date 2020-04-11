import { AdminSPFDto } from './spf.dto';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class AdminProductReviewFilterDto extends AdminSPFDto {
  @IsOptional()
  @Transform((value => Number(value)))
  @IsNumber()
  productId: number;
}
