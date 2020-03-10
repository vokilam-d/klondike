import { IsString } from 'class-validator';
import { ProductReviewComment } from '../../../reviews/product-review/models/product-review.model';

export class ClientAddProductReviewCommentDto implements Pick<ProductReviewComment, 'name' | 'text' | 'email'> {
  @IsString()
  name: string;

  @IsString()
  text: string;

  @IsString()
  email: string;
}
