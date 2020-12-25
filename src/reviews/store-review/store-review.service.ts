import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { StoreReview } from './models/store-review.model';
import { BaseReviewService } from '../base-review/base-review.service';
import { AdminStoreReviewDto } from '../../shared/dtos/admin/store-review.dto';
import { CounterService } from '../../shared/services/counter/counter.service';
import { MediaService } from '../../shared/services/media/media.service';
import { SearchService } from '../../shared/services/search/search.service';
import { ElasticStoreReviewModel } from './models/elastic-store-review.model';
import { plainToClass } from 'class-transformer';
import { EmailService } from '../../email/email.service';
import { ClientAddStoreReviewDto } from '../../shared/dtos/client/add-store-review.dto';

@Injectable()
export class StoreReviewService extends BaseReviewService<StoreReview, AdminStoreReviewDto> implements OnApplicationBootstrap {

  get collectionName(): string { return StoreReview.collectionName; }
  protected ElasticReview = ElasticStoreReviewModel;

  constructor(@InjectModel(StoreReview.name) protected readonly reviewModel: ReturnModelType<typeof StoreReview>,
              protected readonly counterService: CounterService,
              protected readonly searchService: SearchService,
              protected readonly emailService: EmailService,
              protected readonly mediaService: MediaService) {
    super();
  }

  async createReview(reviewDto: AdminStoreReviewDto | ClientAddStoreReviewDto): Promise<AdminStoreReviewDto> {
    const review = await super.createReview((reviewDto as AdminStoreReviewDto));
    this.emailService.sendNewStoreReviewEmail(review).then();
    return review;
  }

  async countAverageRating(): Promise<number> {
    const ratingProp: keyof StoreReview = 'rating';
    const ratingAggregation: { rating: number }[] = await this.reviewModel.aggregate([{
      $group: {
        _id: null,
        rating: { $avg: `$${ratingProp}` }
      }
    }]);

    return Math.round(ratingAggregation[0].rating * 10) / 10;
  }

  transformReviewToDto(review: DocumentType<StoreReview>, ipAddress?: string, userId?: string, customerId?: number): AdminStoreReviewDto {
    review = review.toJSON();

    const transformed = {
      ...review,
      votesCount: review.votes.length,
      hasClientVoted: this.hasVoted(review, ipAddress, userId, customerId)
    };

    return plainToClass(AdminStoreReviewDto, transformed, { excludeExtraneousValues: true });
  }
}
