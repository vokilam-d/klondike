import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { BaseReviewService } from '../base-review/base-review.service';
import { AdminProductReviewDto } from '../../shared/dtos/admin/product-review.dto';
import { ProductReview, ProductReviewComment } from './models/product-review.model';
import { ProductService } from '../../product/product.service';
import { ClientSession } from 'mongoose';
import { CounterService } from '../../shared/counter/counter.service';
import { MediaService } from '../../shared/media-service/media.service';
import { ElasticProductReviewModel } from './models/elastic-product-review.model';
import { SearchService } from '../../shared/search/search.service';
import { plainToClass } from 'class-transformer';
import { ClientAddProductReviewCommentDto } from '../../shared/dtos/client/product-review-comment.dto';
import { ClientProductReviewDto } from '../../shared/dtos/client/product-review.dto';
import { ClientAddProductReviewDto } from '../../shared/dtos/client/add-product-review.dto';

@Injectable()
export class ProductReviewService extends BaseReviewService<ProductReview, AdminProductReviewDto> {

  get collectionName(): string { return ProductReview.collectionName; }
  protected ElasticReview = ElasticProductReviewModel;

  constructor(@InjectModel(ProductReview.name) protected readonly reviewModel: ReturnModelType<typeof ProductReview>,
              @Inject(forwardRef(() => ProductService)) private readonly productService: ProductService,
              protected readonly searchService: SearchService,
              protected readonly counterService: CounterService,
              protected readonly mediaService: MediaService) {
    super();
  }

  async findReviewsByProductId(productId: number,
                               onlyEnabled: boolean,
                               ipAddress?: string,
                               userId?: string,
                               customerId?: number
  ): Promise<AdminProductReviewDto[]> {

    const conditions: Partial<ProductReview> = { productId };
    if (onlyEnabled) { conditions.isEnabled = true; }

    const found = await this.reviewModel.find(conditions).exec();
    return found.map(review => this.transformReviewToDto(review, ipAddress, userId, customerId, onlyEnabled));
  }

  async createReview(reviewDto: AdminProductReviewDto | ClientAddProductReviewDto, migrate?): Promise<AdminProductReviewDto> {
    return super.createReview(reviewDto, (review, session) => this.productService.addReviewToProduct(review, session), migrate);
  }

  async updateReview(reviewId: string, reviewDto: AdminProductReviewDto): Promise<AdminProductReviewDto> {
    const onEnable = (review, session) => this.productService.addReviewToProduct(review, session);
    const onDisable = (review, session) => this.productService.removeReviewFromProduct(review, session);

    return super.updateReview(reviewId, reviewDto, { onEnable, onDisable });
  }

  async deleteReview(reviewId: string): Promise<AdminProductReviewDto> {
    return super.deleteReview(reviewId, (review, session) => this.productService.removeReviewFromProduct(review, session));
  }

  async deleteReviewsByProductId(productId: number, session: ClientSession) {
    return this.reviewModel.deleteMany({ productId }).session(session).exec();
  }

  transformReviewToDto(
    review: DocumentType<ProductReview>,
    ipAddress?: string,
    userId?: string,
    customerId?: number,
    onlyEnabled?: boolean
  ): AdminProductReviewDto {
    review = review.toJSON();

    const comments = onlyEnabled ? review.comments.filter(c => c.isEnabled) : review.comments;
    const transformed = {
      ...review,
      comments,
      votesCount: review.votes.length,
      hasClientVoted: this.hasVoted(review, ipAddress, userId, customerId)
    } as any;

    return plainToClass(AdminProductReviewDto, transformed, { excludeExtraneousValues: true });
  }

  async addComment(reviewId: number, commentDto: ClientAddProductReviewCommentDto, customerId: any): Promise<DocumentType<ProductReview>> {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException(`Review with id '${reviewId}' not found`);
    }

    const comment = new ProductReviewComment();
    Object.assign(comment, commentDto);
    if (customerId) {
      comment.customerId = customerId;
    }

    review.comments.push(comment);
    await review.save();

    return review;
  }
}
