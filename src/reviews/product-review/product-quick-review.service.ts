import { ForbiddenException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { AdminProductService } from '../../product/services/admin-product.service';
import { ProductQuickReview } from './models/product-quick-review.model';
import { AddProductQuickReviewDto } from '../../shared/dtos/client/add-product-quick-review.dto';
import { __ } from '../../shared/helpers/translate/translate.function';
import { ClientSession } from 'mongoose';
import { ShipmentDto } from '../../shared/dtos/admin/shipment.dto';
import { Language } from '../../shared/enums/language.enum';

@Injectable()
export class ProductQuickReviewService {

  constructor(
    @InjectModel(ProductQuickReview.name) protected readonly quickReviewModel: ReturnModelType<typeof ProductQuickReview>,
    @Inject(forwardRef(() => AdminProductService)) private readonly productService: AdminProductService
  ) {}

  async createQuickReview(
    productId: number,
    quickReviewDto: AddProductQuickReviewDto,
    ip: string,
    userId: string,
    customerId: number,
    lang: Language
  ): Promise<ProductQuickReview> {

    const alreadyVoted = await this.quickReviewModel.findOne({
      productId,
      ...(ip ? { ip } : { }),
      ...(userId ? { userId } : { }),
      ...(customerId ? { customerId } : { }),
    }).exec();

    if (alreadyVoted) {
      throw new ForbiddenException(__('You have already rated this product', lang));
    }

    const session = await this.quickReviewModel.db.startSession();
    session.startTransaction();
    try {
      const [quickReview] = await this.quickReviewModel.create([{
        productId,
        rating: quickReviewDto.rating,
        ip,
        customerId,
        userId
      }], { session });

      await this.productService.updateReviewRating(productId, lang, session);
      await session.commitTransaction();
      this.productService.onProductUpdate();

      return quickReview;

    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }
  }

  async findByProductId(productId: number, session: ClientSession): Promise<ProductQuickReview[]> {
    return this.quickReviewModel.find({ productId }).session(session).exec();
  }
}
