import { ClientSPFDto } from './spf.dto';
import { IsOptional } from 'class-validator';
import { ISorting } from '../shared-dtos/spf.dto';
import { AdminStoreReviewDto } from '../admin/store-review.dto';

enum EReviewsSort {
  New = 'new',
  Old = 'old',
  Popularity = 'popularity',
  HighRating = 'high-rating',
  LowRating = 'low-rating'
}

export class ClientStoreReviewsSPFDto extends ClientSPFDto {
  @IsOptional()
  sort?: string;

  getSortAsObj(): ISorting {
    const createdAtProp: keyof AdminStoreReviewDto = 'createdAt';
    const ratingProp: keyof AdminStoreReviewDto = 'rating';
    const votesCountProp: keyof AdminStoreReviewDto = 'votesCount';

    const sort: ISorting = {  };

    switch (this.sort) {
      case EReviewsSort.New:
        sort[createdAtProp] = 'desc';
        break;
      case EReviewsSort.Old:
        sort[createdAtProp] = 'asc';
        break;
      case EReviewsSort.Popularity:
        sort[votesCountProp] = 'desc';
        break;
      case EReviewsSort.HighRating:
        sort[ratingProp] = 'desc';
        break;
      case EReviewsSort.LowRating:
        sort[ratingProp] = 'asc';
        break;
    }

    return sort;
  }

  filters: string;

  hasFilters(): boolean {
    return false;
  }
}
