import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { StoreReview } from './models/store-review.model';
import { BaseReviewService } from '../base-review/base-review.service';
import { StoreReviewDto } from '../../shared/dtos/admin/store-review.dto';
import { CounterService } from '../../shared/counter/counter.service';
import { MediaService } from '../../shared/media-service/media.service';

@Injectable()
export class StoreReviewService extends BaseReviewService<StoreReview, StoreReviewDto> {

  get collectionName(): string { return StoreReview.collectionName; }

  constructor(@InjectModel(StoreReview.name) protected readonly reviewModel: ReturnModelType<typeof StoreReview>,
              protected readonly counterService: CounterService,
              protected readonly mediaService: MediaService) {
    super();
  }

  transformReviewToDto(review: DocumentType<StoreReview>, ipAddress?: string, userId?: string, customerId?: number): StoreReviewDto {
    review = review.toJSON();

    return {
      ...review,
      votesCount: review.votes.length,
      hasClientVoted: this.hasVoted(review, ipAddress, userId, customerId)
    } as any;
  }
}
