import { AdminProductReviewCommentDto, AdminProductReviewDto } from '../admin/product-review.dto';
import { Exclude, Type } from 'class-transformer';

export class ClientProductReviewCommentDto extends AdminProductReviewCommentDto {
  @Exclude()
  isEnabled: boolean;
}

export class ClientProductReviewDto extends AdminProductReviewDto {
  @Exclude()
  isEnabled: boolean;

  @Type(() => ClientProductReviewCommentDto)
  comments: ClientProductReviewCommentDto[];
}
