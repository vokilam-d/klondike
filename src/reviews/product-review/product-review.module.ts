import { forwardRef, Module } from '@nestjs/common';
import { ProductReviewService } from './product-review.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductReview, ProductReviewModel } from './models/product-review.model';
import { ProductQuickReview, ProductQuickReviewModel } from './models/product-quick-review.model';
import { AdminProductReviewController } from './admin-product-review.controller';
import { ProductModule } from '../../product/product.module';
import { ClientProductReviewController } from './client-product-review.controller';
import { ProductQuickReviewService } from './product-quick-review.service';
import { EmailModule } from '../../email/email.module';
import { CustomerModule } from '../../customer/customer.module';

const productReviewModel = {
  name: ProductReviewModel.modelName,
  schema: ProductReviewModel.schema,
  collection: ProductReview.collectionName
};

const productQuickReviewModel = {
  name: ProductQuickReviewModel.modelName,
  schema: ProductQuickReviewModel.schema,
  collection: ProductQuickReview.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([productReviewModel, productQuickReviewModel]),
    forwardRef(() => ProductModule),
    forwardRef(() => CustomerModule),
    EmailModule
  ],
  providers: [ProductReviewService, ProductQuickReviewService],
  controllers: [AdminProductReviewController, ClientProductReviewController],
  exports: [ProductReviewService, ProductQuickReviewService]
})
export class ProductReviewModule {}
