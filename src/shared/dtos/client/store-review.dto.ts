import { AdminStoreReviewDto } from '../admin/store-review.dto';
import { Exclude } from 'class-transformer';

export class ClientStoreReviewDto extends AdminStoreReviewDto {
  @Exclude()
  isEnabled: boolean;
}
