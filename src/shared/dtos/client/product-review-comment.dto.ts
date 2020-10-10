import { IsString } from 'class-validator';
import { ProductReviewComment } from '../../../reviews/product-review/models/product-review.model';
import { TrimString } from '../../decorators/trim-string.decorator';

export class ClientAddProductReviewCommentDto implements Pick<ProductReviewComment, 'name' | 'text' | 'email'> {
  @IsString()
  @TrimString()
  name: string;

  @IsString()
  @TrimString()
  text: string;

  @IsString()
  @TrimString()
  email: string;
}
