import { Module } from '@nestjs/common';
import { ProductReviewService } from './product-review.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductReview, ProductReviewModel } from './models/product-review.model';
import { AdminProductReviewController } from './admin-product-review.controller';

const productReviewModel = {
  name: ProductReviewModel.modelName,
  schema: ProductReviewModel.schema,
  collection: ProductReview.collectionName
};

@Module({
  imports: [MongooseModule.forFeature([productReviewModel])],
  providers: [ProductReviewService],
  exports: [ProductReviewService],
  controllers: [AdminProductReviewController]
})
export class ProductReviewModule {}
