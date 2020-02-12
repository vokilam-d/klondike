import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { MediaService } from '../../shared/media-uploader/media-uploader/media.service';
import { BaseReviewService } from '../base-review/base-review.service';
import { ProductReviewDto } from '../../shared/dtos/admin/product-review.dto';
import { ProductReview } from './models/product-review.model';
import { ProductService } from '../../product/product.service';
import { ClientSession } from 'mongoose';

@Injectable()
export class ProductReviewService extends BaseReviewService<ProductReview, ProductReviewDto> {

  get collectionName(): string { return ProductReview.collectionName; }

  constructor(@InjectModel(ProductReview.name) protected readonly reviewModel: ReturnModelType<typeof ProductReview>,
              @Inject(forwardRef(() => ProductService)) private readonly productService: ProductService,
              protected readonly mediaService: MediaService) {
    super();
  }

  async findReviewsByProductId(productId: number): Promise<ProductReviewDto[]> {
    const found = await this.reviewModel.find({ productId }).exec();
    return found.map(review => this.transformReviewToDto(review));
  }

  async createReview(reviewDto: ProductReviewDto): Promise<ProductReviewDto> {
    return super.createReview(reviewDto, (review, session) => this.productService.addReviewToProduct(review, session));
  }

  async deleteReview(reviewId: string): Promise<ProductReviewDto> {
    return super.deleteReview(reviewId, (review, session) => this.productService.removeReviewFromProduct(review, session));
  }

  async deleteReviewsByProductId(productId: number, session: ClientSession) {
    return this.reviewModel.deleteMany({ productId }).session(session).exec();
  }

  transformReviewToDto(
    review: DocumentType<ProductReview>,
    ipAddress?: string,
    userId?: string,
    customerId?: number
  ): ProductReviewDto {
    review = review.toJSON();

    return {
      ...review,
      votesCount: review.votes.length,
      hasClientVoted: this.hasVoted(review, ipAddress, userId, customerId)
    } as any;
  }
}
