import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { AdminBaseReviewDto } from './base-review.dto';
import { TrimString } from '../../decorators/trim-string.decorator';

export class AdminStoreReviewDto extends AdminBaseReviewDto {
  @Expose()
  @IsString()
  @TrimString()
  managerComment?: string;
}
