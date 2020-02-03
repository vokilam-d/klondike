import { Module } from '@nestjs/common';
import { AdminStoreReviewController } from './admin-store-review.controller';
import { StoreReviewService } from './store-review.service';
import { MongooseModule } from '@nestjs/mongoose';
import { StoreReview, StoreReviewModel } from './models/store-review.model';
import { ClientStoreReviewController } from './client-store-review.controller';

const storeReviewModel = {
  name: StoreReviewModel.modelName,
  schema: StoreReviewModel.schema,
  collection: StoreReview.collectionName
};

@Module({
  imports: [MongooseModule.forFeature([storeReviewModel])],
  controllers: [AdminStoreReviewController, ClientStoreReviewController],
  providers: [StoreReviewService]
})
export class StoreReviewModule {}
