import { Expose } from 'class-transformer';

export class ReviewAverageRatingDto {
  @Expose()
  count: number;

  @Expose()
  avgRating: number;
}

export class CustomerReviewsAverageRatingDto {
  @Expose()
  storeReviews: ReviewAverageRatingDto;

  @Expose()
  productReviews: ReviewAverageRatingDto;
}
