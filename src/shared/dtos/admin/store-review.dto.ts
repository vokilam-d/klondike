import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { BaseReviewDto } from './base-review.dto';

export class StoreReviewDto extends BaseReviewDto {
  @Expose()
  @IsString()
  managerComment: string;
}
