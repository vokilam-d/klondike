import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { MediaService } from '../../shared/media-uploader/media-uploader/media.service';
import { BaseReviewService } from '../base-review/base-review.service';
import { ProductReviewDto } from '../../shared/dtos/admin/product-review.dto';
import { ProductReview } from './models/product-review.model';
import { ProductService } from '../../product/product.service';

@Injectable()
export class ProductReviewService extends BaseReviewService<ProductReview, ProductReviewDto> {

  get collectionName(): string { return ProductReview.collectionName; }

  constructor(@InjectModel(ProductReview.name) protected readonly reviewModel: ReturnModelType<typeof ProductReview>,
              private readonly productService: ProductService,
              protected readonly mediaService: MediaService) {
    super();
  }

  async createReview(reviewDto: ProductReviewDto): Promise<ProductReviewDto> {
    const callback = (review, session) => this.productService.addReviewId(review, session);
    return super.createReview(reviewDto, callback);
  }

  async deleteReview(reviewId: string): Promise<ProductReviewDto> {
    const callback = (review, session) => this.productService.deleteReviewId(review, session);
    return super.deleteReview(reviewId, callback);
  }

  transformReviewToDto(review: ProductReview, ipAddress?: string, userId?: string, customerId?: number): ProductReviewDto {
    return {
      ...review,
      votesCount: review.votes.length,
      hasClientVoted: this.hasVoted(review, ipAddress, userId, customerId)
    } as any;
  }
}
