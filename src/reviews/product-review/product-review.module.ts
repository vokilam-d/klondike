import { forwardRef, Module } from '@nestjs/common';
import { ProductReviewService } from './product-review.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductReview, ProductReviewModel } from './models/product-review.model';
import { AdminProductReviewController } from './admin-product-review.controller';
import { ProductModule } from '../../product/product.module';
import { ClientProductReviewController } from './client-product-review.controller';
import { CustomerModule } from '../../customer/customer.module';

const productReviewModel = {
  name: ProductReviewModel.modelName,
  schema: ProductReviewModel.schema,
  collection: ProductReview.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([productReviewModel]),
    forwardRef(() => ProductModule)
  ],
  providers: [ProductReviewService],
  controllers: [AdminProductReviewController, ClientProductReviewController],
  exports: [ProductReviewService]
})
export class ProductReviewModule {}
