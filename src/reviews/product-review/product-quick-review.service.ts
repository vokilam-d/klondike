import { ForbiddenException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { ProductService } from '../../product/services/product.service';
import { ProductQuickReview } from './models/product-quick-review.model';
import { AddProductQuickReviewDto } from '../../shared/dtos/client/add-product-quick-review.dto';
import { __ } from '../../shared/helpers/translate/translate.function';

@Injectable()
export class ProductQuickReviewService {

  constructor(@InjectModel(ProductQuickReview.name) protected readonly quickReviewModel: ReturnModelType<typeof ProductQuickReview>,
              @Inject(forwardRef(() => ProductService)) private readonly productService: ProductService
  ) {}

  async createQuickReview(productId: number, quickReviewDto: AddProductQuickReviewDto, ipAddress: string, userId: string, customerId: number): Promise<ProductQuickReview> {
    const alreadyVoted = await this.quickReviewModel.findOne({
      productId,
      $or: [
        { ip: ipAddress },
        { userId },
        { customerId }
      ]
    }).exec();
    if (alreadyVoted) { throw new ForbiddenException(__('You have already rated this product', 'ru')); }

    const session = await this.quickReviewModel.db.startSession();
    session.startTransaction();
    try {
      const [quickReview] = await this.quickReviewModel.create([{
        productId,
        rating: quickReviewDto.rating,
        ip: ipAddress,
        customerId,
        userId
      }], { session });
      await this.productService.addReviewRatingToProduct(productId, quickReviewDto.rating, true, session);
      await session.commitTransaction();

      return quickReview;

    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }
  }
}
