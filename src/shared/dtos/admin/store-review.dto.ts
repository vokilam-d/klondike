import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { AdminBaseReviewDto } from './base-review.dto';

export class AdminStoreReviewDto extends AdminBaseReviewDto {
  @Expose()
  @IsString()
  managerComment?: string;
}
